// eslint-disable-next-line
/// <reference path="./dissolve.d.ts" />
// eslint-disable-next-line
/// <reference path="./types.d.ts" />

import { dirname } from "path";
import { chdir } from "process";
import { fileURLToPath } from "url";
import dissolve from "geojson-dissolve";
import _ from "lodash";
import { LD } from "./ld";
import { ByGeo, ByProject, ByTaxLevel, Metadata, WorldMap } from "./types";
import { download, getLd, read, stream, throttle, write } from "./util";

/**
 * pre-compile step that takes the "raw" distributed data (csv/tsv), and
 * processs and pares it down to just what the website needs (json).
 */

/** url with JSON-LD containing latest downloads and other metadata */
const ldUrl = "https://doi.org/10.5281/zenodo.8186993";

/** raw taxonomic data */
const taxonomicFile = "taxonomic_table.csv";

/** raw sample metadata */
const metadataFile = "sample_metadata.tsv";

/** raw natural earth data */
const naturalEarthFile = "natural-earth.json";
/** https://www.naturalearthdata.com/downloads/110m-cultural-vectors/ */
/** https://github.com/nvkelso/natural-earth-vector/blob/master/geojson */
/** https://rawgit.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson */

/** set working directory to directory of this script */
chdir(dirname(fileURLToPath(import.meta.url)));

/** process natural earth world map data */
const processNaturalEarth = async (): Promise<ByGeo> => {
  /** load natural earth data */
  const worldMap = read<WorldMap>(naturalEarthFile);

  /** filter out null property */
  const clean = (value: unknown) => {
    if (typeof value !== "string") return "";
    if (["-99"].includes(value)) return "";
    return value;
  };

  /** map of all countries to their regions */
  const countryToRegion = read<{ [key: string]: string }>(
    "./country-to-region.json",
  );

  for (const feature of worldMap.features) {
    const country = _.startCase(clean(feature.properties.NAME));
    const code = (
      clean(feature.properties.ISO_A2_EH) ||
      clean(feature.properties.ISO_A2) ||
      clean(feature.properties.ADM0_ISO) ||
      clean(feature.properties.ADM0_A3)
    ).toUpperCase();
    const region: string = countryToRegion[code] || "";

    /** only keep needed properties (opt-in) */
    feature.properties = { region, country, code, samples: 0 };
  }

  return worldMap as ByGeo;
};

/** process main data */
const processData = async (
  taxonomicFile: string,
  metadataFile: string,
  worldMap: ByGeo,
) => {
  /** stream files line by line */
  const taxonomicStream = stream(taxonomicFile);
  const metadataStream = stream(metadataFile);

  /** map of unique projects */
  const byProject: { [key: ByProject[number]["project"]]: ByProject[number] } =
    {};
  /** map of unique countries */
  const byCountry: { [key: string]: ByGeo["features"][number] } = {};
  /** map of unique regions */
  const byRegion: { [key: string]: ByGeo["features"][number] } = {};
  /** map of unique phyla */
  const byPhylum: { [key: string]: ByTaxLevel[number] } = {};
  /** map of unique classes */
  const byClass: { [key: string]: ByTaxLevel[number] } = {};

  /** whether country feature has already been dissolved into region feature */
  const countryDissolved: { [key: string]: boolean } = {};

  /** add all natural earth features */
  for (const feature of worldMap.features) {
    const { region, code } = feature.properties;

    /** add feature as country */
    byCountry[code] = _.cloneDeep(feature);

    if (!byRegion[region]) {
      /** add feature as region */
      byRegion[region] = _.cloneDeep(feature);

      /** unset country specific info */
      byRegion[region].properties.country = "";
      byRegion[region].properties.code = "";
    } else {
      /** merge features together into region */
      if (!countryDissolved[code]) {
        byRegion[region].geometry = dissolve([byRegion[region], feature]);
        countryDissolved[code] = true;
      }
    }
  }

  /** get first/header row of files */
  const [{ value: taxonomicHeaderRaw = [] }] = await Promise.all([
    taxonomicStream.next(),
    metadataStream.next(),
  ]);

  /** process headers */
  const taxonomicHeader = taxonomicHeaderRaw.map((cell) => {
    const [kingdom = "", phylum = "", _class = ""] = cell
      .replace(/"/g, "")
      .split(".")
      .filter((taxon) => taxon !== "NA");
    return { kingdom, phylum, _class };
  });

  /** loop through rest of rows (with hard limit) */
  for (let row = 0; row < 1000000; row++) {
    /** show progress periodically */
    if (throttle("data")) console.info(`Row ${row}`);

    /** read current row from files */
    const [
      { value: taxonomicRow = [], done: taxonomicDone },
      { value: metadataRow = [], done: metadataDone },
    ] = await Promise.all([taxonomicStream.next(), metadataStream.next()]);

    /** if no more data, exit */
    if (taxonomicDone && metadataDone) break;

    /** get sample metadata cols */
    const [sample, project, , , , , , , , code, region] = metadataRow;
    // const country = _.startCase(geoLoc.split(":").shift());

    /** count country */
    if (byCountry[code]) byCountry[code].properties.samples++;
    /** count region */
    if (byRegion[region]) byRegion[region].properties.samples++;

    /** accumulate projects and samples */
    byProject[project] ??= { project, samples: [] };
    byProject[project].samples.push(sample);

    /** whether row (sample) has already been counted toward taxon */
    const phylumCounted: { [key: string]: boolean } = {};
    const classCounted: { [key: string]: boolean } = {};

    /** loop through taxonomic table columns */
    for (let col = 2; col < taxonomicRow.length; col++) {
      const cell = taxonomicRow[col];

      /** if taxon present in sample */
      if (cell !== "0") {
        /** get props from header row */
        const taxon = { ...taxonomicHeader[col], samples: { total: 0 } };
        const { phylum, _class } = taxon;

        /** count sample toward phylum (if not already) */
        if (!phylumCounted[phylum]) {
          byPhylum[phylum] ??= _.cloneDeep(taxon);
          byPhylum[phylum]._class = "";
          byPhylum[phylum].samples.total++;
          byPhylum[phylum].samples[code] ??= 0;
          byPhylum[phylum].samples[code]++;
          byPhylum[phylum].samples[region] ??= 0;
          byPhylum[phylum].samples[region]++;
          phylumCounted[phylum] = true;
        }

        /** count sample toward class (if not already) */
        if (!classCounted[_class]) {
          byClass[_class] ??= _.cloneDeep(taxon);
          byClass[_class].samples.total++;
          byClass[_class].samples[code] ??= 0;
          byClass[_class].samples[code]++;
          byClass[_class].samples[region] ??= 0;
          byClass[_class].samples[region]++;
          classCounted[_class] = true;
        }
      }
    }
  }

  return {
    byProject: Object.values(byProject).sort(
      (a, b) => b.samples.length - a.samples.length,
    ),
    byPhylum: Object.values(byPhylum)
      .sort((a, b) => b.samples.total - a.samples.total)
      .filter(({ phylum }) => phylum),
    byClass: Object.values(byClass)
      .sort((a, b) => b.samples.total - a.samples.total)
      .filter(({ _class }) => _class),
    byCountry: { ...worldMap, features: Object.values(byCountry) },
    byRegion: { ...worldMap, features: Object.values(byRegion) },
  };
};

/** derive metadata about data */
const deriveMetadata = (
  byProject: ByProject,
  byPhylum: ByTaxLevel,
  byClass: ByTaxLevel,
  byRegion: ByGeo,
  byCountry: ByGeo,
  ld: LD,
): Metadata => {
  const projects = byProject.length;
  const samples = byProject.reduce(
    (total, { samples }) => total + samples.length,
    0,
  );
  const phyla = byPhylum.filter((taxon) => taxon.samples).length;
  const classes = byClass.filter((taxon) => taxon.samples).length;
  const regions = byRegion.features.filter(
    (feature) => feature.properties.samples,
  ).length;
  const countries = byCountry.features.filter(
    (feature) => feature.properties.samples,
  ).length;

  return {
    projects,
    samples,
    phyla,
    classes,
    regions,
    countries,
    date: ld.datePublished,
    url: ld["@id"],
    version: ld.version,
  };
};

/** main workflow */

console.info("Getting data download links and meta");
const ld = await getLd(ldUrl);

if (!process.env.SKIP_DOWNLOAD) {
  console.info("Downloading raw data");
  for (const { contentUrl } of ld.distribution) await download(contentUrl);
}

console.info("Cleaning world map data");
const worldMap = await processNaturalEarth();

console.info("Processing data");
const { byProject, byPhylum, byClass, byCountry, byRegion } = await processData(
  taxonomicFile,
  metadataFile,
  worldMap,
);
write("../public/by-project.json", byProject);
write("../public/by-phylum.json", byPhylum);
write("../public/by-class.json", byClass);
write("../public/by-country.json", byCountry);
write("../public/by-region.json", byRegion);

console.info("Deriving metadata");
const metadata = deriveMetadata(
  byProject,
  byPhylum,
  byClass,
  byRegion,
  byCountry,
  ld,
);
write("../public/metadata.json", metadata, true);

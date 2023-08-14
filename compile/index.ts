// eslint-disable-next-line
/// <reference path="./dissolve.d.ts" />
// eslint-disable-next-line
/// <reference path="./types.d.ts" />

import { readFileSync } from "fs";
import { dirname } from "path";
import { chdir } from "process";
import { fileURLToPath } from "url";
import dissolve from "geojson-dissolve";
import _ from "lodash";
import { LD } from "./ld";
import {
  ByMap,
  ByProject,
  ByTaxLevel,
  Countries,
  Features,
  Metadata,
} from "./types";
import { download, getLd, request, stream, throttle, write } from "./util";

/**
 * pre-compile step that takes the "raw" distributed data (csv/tsv), and
 * processs and pares it down to just what the website needs (json).
 */

/** url with JSON-LD containing latest downloads and other metadata */
const ldUrl = "https://doi.org/10.5281/zenodo.8186993";

/** raw taxonomic data */
const taxonomicData = "taxonomic_table.csv";

/** raw sample metadata */
const sampleData = "sample_metadata.tsv";

/** raw natural earth data */
const naturalEarthData =
  "https://rawgit.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
/** https://www.naturalearthdata.com/downloads/110m-cultural-vectors/ */
/** https://github.com/nvkelso/natural-earth-vector/blob/master/geojson */

/** set working directory to directory of this script */
chdir(dirname(fileURLToPath(import.meta.url)));

/** process natural earth world map data */
const processNaturalEarth = async (): Promise<ByMap> => {
  /** fetch natural earth data */
  const data = await request<Features>(naturalEarthData);

  /** filter out null property */
  const clean = (value: unknown) => {
    if (typeof value !== "string") return "";
    if (["-99"].includes(value)) return "";
    return value;
  };

  /** map of all countries to their regions */
  const countryToRegion = JSON.parse(
    readFileSync("./country-to-region.json", "utf-8"),
  );

  for (const feature of data.features) {
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

  return data as ByMap;
};

/** process main data */
const processData = async (taxonomicData, sampleData) => {
  /** stream files line by line */
  const taxonomicStream = stream(taxonomicData);
  const sampleStream = stream(sampleData);

  /** map of unique projects */
  const byProject: { [key: ByProject[number]["project"]]: ByProject[number] } =
    {};
  /** map of unique phyla */
  const byPhylum: { [key: string]: ByTaxLevel[number] } = {};
  /** map of unique classes */
  const byClass: { [key: string]: ByTaxLevel[number] } = {};
  /** map of unique countries */
  const countries: Countries = {};

  /** get first/header row of files */
  const [{ value: taxonomicHeaderRaw = [] }] = await Promise.all([
    taxonomicStream.next(),
    sampleStream.next(),
  ]);

  /** process headers */
  const taxonomicHeader = taxonomicHeaderRaw.map((cell) => {
    const [kingdom = "", phylum = "", _class = ""] = cell
      .replace(/"/g, "")
      .split(".");
    return { kingdom, phylum, _class };
  });

  /** loop through rest of rows (with hard limit) */
  for (let row = 0; row < 1000000; row++) {
    /** show progress periodically */
    if (throttle("data")) console.info(`Row ${row}`);

    /** read current row from files */
    const [
      { value: taxonomicRow = [], done: taxDone },
      { value: sampleRow = [], done: sampleDone },
    ] = await Promise.all([taxonomicStream.next(), sampleStream.next()]);

    /** if no more data, exit */
    if (sampleDone && taxDone) break;

    /** get row cell values */
    const [
      sample,
      project,
      run,
      libraryStrategy,
      librarySource,
      pubdate,
      totalBases,
      instrument,
      geoLoc,
      code,
      region,
    ] = sampleRow;

    const country = _.startCase(geoLoc.split(":").pop());

    /** accumulate projects and samples */
    byProject[project] ??= { project, samples: [] };
    byProject[project].samples.push(sample);

    /** accumulate countries */
    countries[code] ??= { region, country, code, samples: 0 };
    countries[code].samples++;

    /** whether row (sample) has already been counted toward taxon */
    const phylumCounted: { [key: string]: boolean } = {};
    const classCounted: { [key: string]: boolean } = {};

    /** loop through taxonomic columns */
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
    byProject: Object.values(byProject),
    byPhylum: Object.values(byPhylum).sort(
      (a, b) => b.samples.total - a.samples.total,
    ),
    byClass: Object.values(byClass).sort(
      (a, b) => b.samples.total - a.samples.total,
    ),
    countries,
  };
};

/** process "by geography" data */
const processByGeographic = (worldMap: ByMap, countries: Countries) => {
  /** accumulate countries */
  const byCountry = _.cloneDeep(worldMap) as ByMap;

  /** lookup sample count from matching country */
  for (const { properties } of byCountry.features)
    properties.samples = countries[properties.code]?.samples || 0;

  /** accumulate regions */
  const byRegion = _.cloneDeep(byCountry);

  /** map of region to feature */
  const regions: { [key: string]: ByMap["features"][number] } = {};

  for (const feature of byRegion.features) {
    /** catch countries without regions */
    if (!feature.properties.region) {
      regions[feature.properties.code] = feature;
      continue;
    }

    /** get region to add to */
    let region = regions[feature.properties.region];

    if (region) {
      /** merge with existing entry */
      region.geometry = dissolve([region, feature]);
      region.properties.samples += feature.properties.samples;
    } else
    /** set new entry */
      region = feature;

    /** unset country-specific details */
    region.properties.country = "";
    region.properties.code = "";

    /** set entry */
    regions[feature.properties.region] = region;
  }

  /** transform object map back to array */
  byRegion.features = Object.values(regions);

  return { byCountry, byRegion };
};

/** derive metadata about data */
const deriveMetadata = (
  byProject: ByProject,
  byPhylum: ByTaxLevel,
  byClass: ByTaxLevel,
  byRegion: ByMap,
  byCountry: ByMap,
  ld: LD,
): Metadata => {
  const projects = byProject.length;
  const samples = byProject.reduce(
    (total, { samples }) => total + samples.length,
    0,
  );
  const phyla = byPhylum.filter((tax) => tax.samples).length;
  const classes = byClass.filter((tax) => tax.samples).length;
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

console.info("Downloading raw data");
for (const { contentUrl } of ld.distribution) await download(contentUrl);

console.info("Getting and cleaning world map data");
const worldMap = await processNaturalEarth();

console.info("Processing data");
const { byProject, byPhylum, byClass, countries } = await processData(
  taxonomicData,
  sampleData,
);
write("../public/by-project.json", byProject);
write("../public/by-phylum.json", byPhylum);
write("../public/by-class.json", byClass);

const { byCountry, byRegion } = processByGeographic(worldMap, countries);

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

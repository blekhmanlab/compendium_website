// eslint-disable-next-line
/// <reference path="./dissolve.d.ts" />
// eslint-disable-next-line
/// <reference path="./types.d.ts" />

import { dirname } from "path";
import { chdir } from "process";
import { fileURLToPath } from "url";
import * as d3 from "d3";
import dissolve from "geojson-dissolve";
import _ from "lodash";
import type {
  ByGeo,
  ByProject,
  ByTag,
  ByTaxLevel,
  Metadata,
  WorldMap,
} from "./types";
import {
  dirSize,
  download,
  logSpace,
  read,
  request,
  stream,
  throttle,
  write,
} from "./util";
import type { _Record, Zenodo } from "./zenodo-api";

/**
 * pre-compile step that takes the "raw" distributed data (csv/tsv), and process
 * and pares it down to just what the website needs (json).
 */

/** record of downloads, version, and other info */
export const recordUrl =
  "https://zenodo.org/api/records?q=conceptrecid:8186993";

/** raw taxonomic data */
const taxonomicFile = "downloaded/taxonomic_table.csv";

/** raw sample metadata */
const metadataFile = "downloaded/sample_metadata.tsv";

/** raw tag data */
const tagsFile = "downloaded/tags.tsv";

/** raw natural earth data */
const naturalEarthFile = "natural-earth.json";
/** https://www.naturalearthdata.com/downloads/110m-cultural-vectors/ */
/** https://github.com/nvkelso/natural-earth-vector/blob/master/geojson */
/** https://rawgit.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson */

/** country to region data */
const countryToRegionFile = "country-to-region.json";

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
  const countryToRegion = read<Record<string, string>>(countryToRegionFile);

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
  const byProject: Record<string, ByProject[number]> = {};
  /** map of unique countries */
  const byCountry: Record<string, ByGeo["features"][number]> = {};
  /** map of unique regions */
  const byRegion: Record<string, ByGeo["features"][number]> = {};
  /** map of unique phyla */
  const byPhylum: Record<string, ByTaxLevel[number]> = {};
  /** map of unique classes */
  const byClass: Record<string, ByTaxLevel[number]> = {};
  /** map of unique samples for counting reads */
  const bySample: Record<
    string,
    {
      reads: number;
      code: string;
      region: string;
    }
  > = {};
  /** map of of unique tags */
  const byTag: Record<
    string,
    {
      tag: string;
      projects: Record<string, string>;
      samples: Record<string, string>;
    }
  > = {};
  /** map of of unique tag values */
  const byTagValue: Record<
    string,
    {
      tag: string;
      value: string;
      project: string;
      samples: number;
    }
  > = {};

  /** whether country feature has already been dissolved into region feature */
  const countryDissolved: Record<string, boolean> = {};

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

  /** process rest of rows (with hard limit) */
  for (let row = 0; row < 1000000; row++) {
    /** show progress periodically */
    if (throttle("data")) console.info(`Processing taxonomic row ${row}`);

    /** read rows */
    const [
      { value: taxonomicRow = [], done: taxonomicDone },
      { value: metadataRow = [], done: metadataDone },
    ] = await Promise.all([taxonomicStream.next(), metadataStream.next()]);

    /** if no more data, exit */
    if (taxonomicDone && metadataDone) break;

    /** get sample metadata cols */
    const [sample = "", project = "", , , , , , , , code = "", region = ""] =
      metadataRow;
    // const country = _.startCase(geoLoc.split(":").shift());

    /** count country */
    if (byCountry[code]) byCountry[code].properties.samples++;
    /** count region */
    if (byRegion[region]) byRegion[region].properties.samples++;

    /** count projects and samples */
    byProject[project] ??= { project, samples: [] };
    byProject[project].samples.push(sample);

    /** whether row (sample) has already been counted toward taxon */
    const phylumCounted: Record<string, boolean> = {};
    const classCounted: Record<string, boolean> = {};

    /** start counting reads for this sample */
    bySample[sample] = { reads: 0, code, region };

    /** loop through taxonomic table columns */
    for (let col = 2; col < taxonomicRow.length; col++) {
      /** number of sequence reads */
      const reads = Number(taxonomicRow[col]);

      /** tally reads for this sample */
      bySample[sample].reads += reads;

      /** if taxon present in sample */
      if (reads > 0) {
        /** get props from header row */
        const taxon = { ...taxonomicHeader[col]!, samples: { total: 0 } };
        const { phylum = "", _class = "" } = taxon;

        /** count sample toward phylum (if not already) */
        if (!phylumCounted[phylum]) {
          byPhylum[phylum] ??= _.cloneDeep(taxon);
          byPhylum[phylum]._class = "";
          byPhylum[phylum].samples.total!++;
          byPhylum[phylum].samples[code] ??= 0;
          byPhylum[phylum].samples[code]++;
          byPhylum[phylum].samples[region] ??= 0;
          byPhylum[phylum].samples[region]++;
          phylumCounted[phylum] = true;
        }

        /** count sample toward class (if not already) */
        if (!classCounted[_class]) {
          byClass[_class] ??= _.cloneDeep(taxon);
          byClass[_class].samples.total!++;
          byClass[_class].samples[code] ??= 0;
          byClass[_class].samples[code]++;
          byClass[_class].samples[region] ??= 0;
          byClass[_class].samples[region]++;
          classCounted[_class] = true;
        }
      }
    }
  }

  /** get reads for particular feature */
  const getReads = (key: string) =>
    Object.values(bySample)
      .filter(
        ({ code, region }) => key === "total" || key === code || key === region,
      )
      .map(({ reads }) => reads);

  /** reads for all samples */
  const totalReads = getReads("total");

  /** get global min and max reads */
  const [min = 0, max = 10000000] = d3.extent(totalReads);
  // const [min, max] = [100, 1000000];

  /** number of bins to split reads into */
  const bins = 50;

  /** d3 binner to put read counts into bins */
  const binner = d3
    .bin()
    .domain([min, max])
    .thresholds(logSpace(min, max, bins));

  /** object with total value and individual key values */
  type WithTotal = { total: number | undefined } & Record<
    string,
    number | undefined
  >;

  /** reads histogram data */
  const byReads: {
    histogram: {
      samples: WithTotal;
      min: number;
      max: number;
      mid: number;
    }[];
    median: WithTotal;
  } = {
    histogram: binner(totalReads).map(({ length, x0 = 0, x1 = 10000000 }) => ({
      samples: { total: length },
      min: x0 || 0,
      max: x1 || 10000000,
      mid: Math.pow(10, (Math.log10(x0) + Math.log10(x1)) / 2),
    })),
    median: { total: d3.median(totalReads) },
  };

  /** record total sample counts and for each geographic feature */
  const features = Object.keys(byCountry).concat(Object.keys(byRegion));

  for (const feature of features) {
    console.info(`Binning read counts for ${feature}`);

    /** reads for this feature */
    const reads = getReads(feature);

    byReads.median[feature] = d3.median(reads);

    /** go through bins of reads for this feature */
    for (const [index, bin] of Object.entries(binner(reads)))
      if (bin.length) {
        const all = byReads.histogram[Number(index)];
        if (all) all.samples[feature] = bin.length;
      }
  }

  /** parse tag counts */
  const tagsStream = stream(tagsFile);

  /** ignore header */
  await tagsStream.next();

  /** process rest of rows (with hard limit) */
  for (let row = 0; row < 100000000; row++) {
    /** show progress periodically */
    if (throttle("data")) console.info(`Processing tag row ${row}`);

    /** read row */
    const {
      value: [project = "", , sample = "", tag = "", value = ""] = [],
      done,
    } = await tagsStream.next();

    /** count tags */
    byTag[tag] ??= { tag, projects: {}, samples: {} };
    byTag[tag].projects[project] = project;
    byTag[tag].samples[sample] = sample;

    /** count tag values */
    const key = [tag, value, project].join("-");
    byTagValue[key] ??= { tag, value, project, samples: 0 };
    byTagValue[key].samples++;

    if (done) break;
  }

  /** turn maps into lists, and do final sorting and such */
  return {
    byProject: _.orderBy(
      Object.values(byProject),
      ["samples.length", "project"],
      ["desc", "asc"],
    ),
    byPhylum: _.orderBy(
      Object.values(byPhylum).filter(({ phylum }) => phylum),
      [(d) => d.samples.total, "phylum"],
      ["desc", "asc"],
    ),
    byClass: _.orderBy(
      Object.values(byClass).filter(({ _class }) => _class),
      [(d) => d.samples.total, "_class"],
      ["desc", "asc"],
    ),
    byCountry: {
      ...worldMap,
      features: _.orderBy(
        Object.values(byCountry),
        [(d) => d.properties.samples, (d) => d.properties.country],
        ["desc", "asc"],
      ),
    },
    byRegion: {
      ...worldMap,
      features: _.orderBy(
        Object.values(byRegion),
        [(d) => d.properties.samples, (d) => d.properties.region],
        ["desc", "asc"],
      ),
    },
    byReads,
    byTag: _.orderBy(
      Object.values(byTag).map((d) => ({
        tag: d.tag,
        projects: Object.keys(d.projects).length,
        samples: Object.keys(d.samples).length,
      })),
      [(d) => d.samples, (d) => d.projects],
      ["desc", "desc"],
    ),
    byTagValue: _.orderBy(
      Object.values(byTagValue),
      [(d) => d.samples],
      ["desc"],
    ),
  };
};

/** derive metadata about data */
const deriveMetadata = async (
  byProject: ByProject,
  byPhylum: ByTaxLevel,
  byClass: ByTaxLevel,
  byRegion: ByGeo,
  byCountry: ByGeo,
  byTag: ByTag,
  record: _Record,
): Promise<Metadata> => {
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
    tags: Object.keys(byTag).length,
    version: record.metadata.version,
    date: record.updated,
    downloads: record.stats.unique_downloads,
    views: record.stats.unique_views,
    size:
      record.files
        ?.map((file) => file.size)
        ?.reduce((total, value) => total + value, 0) || 0,
    uncompressed: await dirSize("./downloaded"),
  };
};

/** main workflow */

console.info("Getting data download links and other info");
const record = (await request<Zenodo>(recordUrl)).hits.hits[0];
if (!record) throw Error("No hits");

if (!process.env.SKIP_DOWNLOAD) {
  console.info("Downloading raw data");
  for (const { key, links } of record.files || [])
    await download(links.self, `downloaded/${key}`);
}

console.info("Cleaning world map data");
const worldMap = await processNaturalEarth();

console.info("Processing data");
const {
  byProject,
  byPhylum,
  byClass,
  byCountry,
  byRegion,
  byReads,
  byTag,
  byTagValue,
} = await processData(taxonomicFile, metadataFile, worldMap);
write("../public/by-project.json", byProject);
write("../public/by-phylum.json", byPhylum);
write("../public/by-class.json", byClass);
write("../public/by-country.json", byCountry);
write("../public/by-region.json", byRegion);
write("../public/by-reads.json", byReads);
write("../public/by-tag.json", byTag);
write("../public/by-tag-value.json", byTagValue);

console.info("Deriving metadata");
const metadata = await deriveMetadata(
  byProject,
  byPhylum,
  byClass,
  byRegion,
  byCountry,
  byTag,
  record,
);
write("../public/metadata.json", metadata, true);

console.info("Summary");
console.info(metadata);

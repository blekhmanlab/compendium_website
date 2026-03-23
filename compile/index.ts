import { dirname } from "path";
import { chdir } from "process";
import { fileURLToPath } from "url";
import type {
  Geo,
  Metadata,
  Projects,
  Tags,
  TaxLevel,
  WorldMap,
} from "./types";
import type { _Record, Zenodo } from "./zenodo-api";
import { bin, extent, median } from "d3";
import dissolve from "geojson-dissolve";
import _ from "lodash";
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

/**
 * pre-compile step that takes the "raw" distributed data (csv/tsv), and pares
 * it down to just what the website needs (json).
 */

const output = "../src/pages/home/data";

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
const processNaturalEarth = async (): Promise<Geo> => {
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
    /** natural earth country name */
    const country = _.startCase(clean(feature.properties.NAME));
    /** natural earth country code */
    const code = (
      clean(feature.properties.ISO_A2_EH) ||
      clean(feature.properties.ISO_A2) ||
      clean(feature.properties.ADM0_ISO) ||
      clean(feature.properties.ADM0_A3)
    ).toUpperCase();
    /** our region from code */
    const region: string = countryToRegion[code] || "";

    /** only keep needed properties (opt-in) */
    feature.properties = { region, country, code, samples: 0 };
  }

  return worldMap as Geo;
};

/** process main data */
const processData = async (
  taxonomicFile: string,
  metadataFile: string,
  worldMap: Geo,
) => {
  /** stream files line by line */
  const taxonomicStream = stream(taxonomicFile);
  const metadataStream = stream(metadataFile);

  /** map of unique projects */
  const projects: Record<string, Projects[number]> = {};
  /** map of unique countries */
  const countries: Record<string, Geo["features"][number]> = {};
  /** map of unique regions */
  const regions: Record<string, Geo["features"][number]> = {};
  /** map of unique phyla */
  const phyla: Record<string, TaxLevel[number]> = {};
  /** map of unique classes */
  const classes: Record<string, TaxLevel[number]> = {};
  /** map of unique samples */
  const samples: Record<
    string,
    {
      sample: string;
      project: string;
      run: string;
      reads: number;
      code: string;
      region: string;
    }
  > = {};
  /** map of of unique tags */
  const tags: Record<
    string,
    {
      tag: string;
      projects: Record<string, string>;
      samples: Record<string, string>;
    }
  > = {};
  /** map of of unique tag values */
  const tagValues: Record<
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
    countries[code] = _.cloneDeep(feature);

    if (!regions[region]) {
      /** add feature as region */
      regions[region] = _.cloneDeep(feature);

      /** unset country specific info */
      regions[region].properties.country = "";
      regions[region].properties.code = "";
    } else {
      /** merge features together into region */
      if (!countryDissolved[code]) {
        regions[region].geometry = dissolve([regions[region], feature]);
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
    const [
      sample = "",
      project = "",
      run = "",
      ,
      ,
      ,
      ,
      ,
      ,
      code = "",
      region = "",
    ] = metadataRow;

    /** count country */
    if (countries[code]) countries[code].properties.samples++;
    /** count region */
    if (regions[region]) regions[region].properties.samples++;

    /** count projects and samples */
    projects[project] ??= { project, samples: [] };
    projects[project].samples.push(sample);

    /** whether row (sample) has already been counted toward taxon */
    const phylumCounted: Record<string, boolean> = {};
    const classCounted: Record<string, boolean> = {};

    /** start counting reads for this sample */
    samples[sample] = { sample, run, project, reads: 0, code, region };

    /** loop through taxonomic table columns */
    for (let col = 2; col < taxonomicRow.length; col++) {
      /** number of sequence reads */
      const reads = Number(taxonomicRow[col]);

      /** tally reads for this sample */
      samples[sample].reads += reads;

      /** if taxon present in sample */
      if (reads > 0) {
        /** get props from header row */
        const taxon = { ...taxonomicHeader[col]!, samples: { total: 0 } };
        const { phylum = "", _class = "" } = taxon;

        /** count sample toward phylum (if not already) */
        if (!phylumCounted[phylum]) {
          phyla[phylum] ??= _.cloneDeep(taxon);
          phyla[phylum]._class = "";
          phyla[phylum].samples.total!++;
          phyla[phylum].samples[code] ??= 0;
          phyla[phylum].samples[code]++;
          phyla[phylum].samples[region] ??= 0;
          phyla[phylum].samples[region]++;
          phylumCounted[phylum] = true;
        }

        /** count sample toward class (if not already) */
        if (!classCounted[_class]) {
          classes[_class] ??= _.cloneDeep(taxon);
          classes[_class].samples.total!++;
          classes[_class].samples[code] ??= 0;
          classes[_class].samples[code]++;
          classes[_class].samples[region] ??= 0;
          classes[_class].samples[region]++;
          classCounted[_class] = true;
        }
      }
    }
  }

  /** get reads for particular feature */
  const getReads = (key: string) =>
    Object.values(samples)
      .filter(
        ({ code, region }) => key === "total" || key === code || key === region,
      )
      .map(({ reads }) => reads);

  /** reads for all samples */
  const totalReads = getReads("total");

  /** get global min and max reads */
  const [min = 0, max = 10000000] = extent(totalReads);

  /** number of bins to split reads into */
  const bins = 50;

  /** d3 binner to put read counts into bins */
  const binner = bin()
    .domain([min, max])
    .thresholds(logSpace(min, max, bins));

  /** object with total value and individual key values */
  type WithTotal = { total: number | undefined } & Record<
    string,
    number | undefined
  >;

  /** reads histogram data */
  const reads: {
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
    median: { total: median(totalReads) },
  };

  /** record total sample counts and for each geographic feature */
  const features = Object.keys(countries).concat(Object.keys(regions));

  for (const feature of features) {
    console.info(`Binning read counts for ${feature}`);

    /** reads for this feature */
    const featureReads = getReads(feature);

    reads.median[feature] = median(featureReads);

    /** go through bins of reads for this feature */
    for (const [index, bin] of Object.entries(binner(featureReads)))
      if (bin.length) {
        const all = reads.histogram[Number(index)];
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
    tags[tag] ??= { tag, projects: {}, samples: {} };
    tags[tag].projects[project] = project;
    tags[tag].samples[sample] = sample;

    /** count tag values */
    const key = [tag, value, project].join("-");
    tagValues[key] ??= { tag, value, project, samples: 0 };
    tagValues[key].samples++;

    if (done) break;
  }

  /** turn maps into lists, and do final sorting and such */
  return {
    projects: _.orderBy(
      Object.values(projects),
      ["samples.length", "project"],
      ["desc", "asc"],
    ),
    samples: Object.values(samples),
    phyla: _.orderBy(
      Object.values(phyla).filter(({ phylum }) => phylum),
      [(datum) => datum.samples.total, "phylum"],
      ["desc", "asc"],
    ),
    classes: _.orderBy(
      Object.values(classes).filter(({ _class }) => _class),
      [(datum) => datum.samples.total, "_class"],
      ["desc", "asc"],
    ),
    countries: {
      ...worldMap,
      features: _.orderBy(
        Object.values(countries),
        [
          (datum) => datum.properties.samples,
          (datum) => datum.properties.country,
        ],
        ["desc", "asc"],
      ),
    },
    regions: {
      ...worldMap,
      features: _.orderBy(
        Object.values(regions),
        [
          (datum) => datum.properties.samples,
          (datum) => datum.properties.region,
        ],
        ["desc", "asc"],
      ),
    },
    reads,
    tags: _.orderBy(
      Object.values(tags).map((datum) => ({
        tag: datum.tag,
        projects: Object.keys(datum.projects).length,
        samples: Object.keys(datum.samples).length,
      })),
      [(datum) => datum.samples, (datum) => datum.projects],
      ["desc", "desc"],
    ),
    tagValues: _.orderBy(
      Object.values(tagValues),
      [(datum) => datum.samples],
      ["desc"],
    ),
  };
};

/** derive metadata about data */
const deriveMetadata = async (
  projects: Projects,
  phyla: TaxLevel,
  classes: TaxLevel,
  regions: Geo,
  countries: Geo,
  tags: Tags,
  record: _Record,
): Promise<Metadata> => ({
  projects: projects.length,
  samples: projects.reduce((total, { samples }) => total + samples.length, 0),
  phyla: phyla.filter((taxon) => taxon.samples).length,
  classes: classes.filter((taxon) => taxon.samples).length,
  regions: regions.features.filter((feature) => feature.properties.samples)
    .length,
  countries: countries.features.filter((feature) => feature.properties.samples)
    .length,
  tags: Object.keys(tags).length,
  version: record.metadata.version,
  date: record.updated,
  downloads: record.stats.unique_downloads,
  views: record.stats.unique_views,
  size:
    record.files
      ?.map((file) => file.size)
      ?.reduce((total, value) => total + value, 0) || 0,
  uncompressed: await dirSize("./downloaded"),
});

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
  projects,
  samples,
  phyla,
  classes,
  countries,
  regions,
  reads,
  tags,
  tagValues,
} = await processData(taxonomicFile, metadataFile, worldMap);
write(`${output}/projects.json`, projects);
write(`${output}/samples.json`, samples, false);
write(`${output}/phyla.json`, phyla);
write(`${output}/classes.json`, classes);
write(`${output}/countries.json`, countries);
write(`${output}/regions.json`, regions);
write(`${output}/reads.json`, reads);
write(`${output}/tags.json`, tags);
write(`${output}/tag-values.json`, tagValues, false);

console.info("Deriving metadata");
const metadata = await deriveMetadata(
  projects,
  phyla,
  classes,
  regions,
  countries,
  tags,
  record,
);
write(`${output}/metadata.json`, metadata, true);

console.info("Summary");
console.info(metadata);

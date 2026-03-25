import { dirname } from "path";
import { chdir } from "process";
import { fileURLToPath } from "url";
import type { FeatureCollection, Geometry } from "geojson";
import type { _Record, Zenodo } from "./types/zenodo-api";
import { bin, extent, median } from "d3";
import dissolve from "geojson-dissolve";
import { cloneDeep, orderBy, startCase } from "lodash";
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

/** set working directory to directory of this script */
chdir(dirname(fileURLToPath(import.meta.url)));

/** main data input directory */
const mainInput = "./downloaded";

/** main data output directory */
const mainOutput = "../src/pages/home/data";

/** projectionist data input directory */
const projectionistInput = "./projectionist";

/** projectionist data output directory */
const projectionistOutput = "../src/pages/projectionist/data";

/** record of downloads, version, and other info */
export const recordUrl = process.env.VITE_RECORD ?? "";

/** local record file */
const recordFile = `${mainInput}/record.json`;

/** raw taxonomic data */
const taxonomicFile = `${mainInput}/taxonomic_table.csv`;

/** raw sample metadata */
const metadataFile = `${mainInput}/sample_metadata.tsv`;

/** raw tag data */
const tagsFile = `${mainInput}/tags.tsv`;

/** (projectionist) sample pcs file */
const samplePCsFile = `${projectionistInput}/sample-pcs.tsv`;

/** (projectionist) taxon pcs file */
const taxonPCsFile = `${projectionistInput}/taxon-pcs.tsv`;

/** (projectionist) taxa map file */
const taxaMapFile = `${projectionistInput}/taxa-map.tsv`;

/** raw natural earth data */
const naturalEarthFile = "./extra/natural-earth.json";
/** https://www.naturalearthdata.com/downloads/110m-cultural-vectors/ */
/** https://github.com/nvkelso/natural-earth-vector/blob/master/geojson */
/** https://rawgit.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson */

/** country to region data */
const countryToRegionFile = "./extra/country-to-region.json";

/** download external input files */
const downloadFiles = async () => {
  console.info("DOWNLOADING FILES");

  const record = (await request<Zenodo>(recordUrl)).hits.hits[0];
  if (!record) throw Error("No hits");
  write(recordFile, record);
  console.info("Downloading raw data");
  for (const { key, links } of record.files || [])
    await download(links.self, `${mainInput}/${key}`);
};

/** process main data */
const processMainData = async () => {
  console.info("PROCESSING MAIN DATA");

  /** process natural earth world map data */
  console.info("Cleaning world map data");

  /** read natural earth data */
  const worldMap = read<
    FeatureCollection<
      Geometry,
      {
        region: string;
        country: string;
        code: string;
        samples: number;
        [key: string]: string | number;
      }
    >
  >(naturalEarthFile);

  type WorldMapFeature = (typeof worldMap.features)[0];

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
    const country = startCase(clean(feature.properties.NAME));
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

  /** map of unique countries */
  const countries: Record<string, WorldMapFeature> = {};
  /** map of unique regions */
  const regions: Record<string, WorldMapFeature> = {};

  /** whether country feature has already been dissolved into region feature */
  const countryDissolved: Record<string, boolean> = {};

  /** add all natural earth features */
  for (const feature of worldMap.features) {
    const { region, code } = feature.properties;

    /** add feature as country */
    countries[code] = cloneDeep(feature);

    if (!regions[region]) {
      /** add feature as region */
      regions[region] = cloneDeep(feature);

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

  /** stream files line by line */
  const taxonomicStream = stream(taxonomicFile);
  const metadataStream = stream(metadataFile);

  /** get first/header row of files */
  const [{ value: taxonomicHeaderRaw = [] }] = await Promise.all([
    taxonomicStream.next(),
    metadataStream.next(),
  ]);

  /** process headers */
  const taxonomicHeader = taxonomicHeaderRaw.map((cell) => {
    const [kingdom = "", phylum = "", _class = ""] = cell
      .split(".")
      .filter((taxon) => taxon !== "NA");
    return { kingdom, phylum, _class };
  });

  /** map of unique projects */
  const projects: Record<
    string,
    {
      project: string;
      samples: string[];
    }
  > = {};
  /** map of unique phyla */
  const phyla: Record<
    string,
    {
      kingdom: string;
      phylum: string;
      _class: string;
      samples: Record<string, number>;
    }
  > = {};
  /** map of unique classes */
  const classes: Record<
    string,
    {
      kingdom: string;
      phylum: string;
      _class: string;
      samples: Record<string, number>;
    }
  > = {};
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
        const taxonomicCol = taxonomicHeader[col];
        /** get props from header row */
        const taxon = { ...taxonomicCol!, samples: { total: 0 } };
        const { phylum = "", _class = "" } = taxon;

        /** count sample toward phylum (if not already) */
        if (!phylumCounted[phylum]) {
          phyla[phylum] ??= cloneDeep(taxon);
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
          classes[_class] ??= cloneDeep(taxon);
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

    /** calculate median */
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
  const projectsOut = orderBy(
    Object.values(projects),
    ["samples.length", "project"],
    ["desc", "asc"],
  );
  const samplesOut = Object.values(samples);
  const phylaOut = orderBy(
    Object.values(phyla).filter(({ phylum }) => phylum),
    [(datum) => datum.samples.total, "phylum"],
    ["desc", "asc"],
  );
  const classesOut = orderBy(
    Object.values(classes).filter(({ _class }) => _class),
    [(datum) => datum.samples.total, "_class"],
    ["desc", "asc"],
  );
  const countriesOut = {
    ...worldMap,
    features: orderBy(
      Object.values(countries),
      [
        (datum) => datum.properties.samples,
        (datum) => datum.properties.country,
      ],
      ["desc", "asc"],
    ),
  };
  const regionsOut = {
    ...worldMap,
    features: orderBy(
      Object.values(regions),
      [(datum) => datum.properties.samples, (datum) => datum.properties.region],
      ["desc", "asc"],
    ),
  };
  const readsOut = reads;
  const tagsOut = orderBy(
    Object.values(tags).map((datum) => ({
      tag: datum.tag,
      projects: Object.keys(datum.projects).length,
      samples: Object.keys(datum.samples).length,
    })),
    [(datum) => datum.samples, (datum) => datum.projects],
    ["desc", "desc"],
  );
  const tagValuesOut = orderBy(
    Object.values(tagValues),
    [(datum) => datum.samples],
    ["desc"],
  );

  /** load zenodo record */
  const record = read<_Record>(recordFile);

  /** derive metadata about data */
  const metadata = {
    projects: projectsOut.length,
    samples: projectsOut.reduce(
      (total, { samples }) => total + samples.length,
      0,
    ),
    phyla: phylaOut.filter((taxon) => taxon.samples).length,
    classes: classesOut.filter((taxon) => taxon.samples).length,
    regions: regionsOut.features.filter((feature) => feature.properties.samples)
      .length,
    countries: countriesOut.features.filter(
      (feature) => feature.properties.samples,
    ).length,
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
  };

  /** save results */
  write(`${mainOutput}/projects.json`, projectsOut);
  write(`${mainOutput}/samples.json`, samplesOut);
  write(`${mainOutput}/phyla.json`, phylaOut);
  write(`${mainOutput}/classes.json`, classesOut);
  write(`${mainOutput}/countries.json`, countriesOut);
  write(`${mainOutput}/regions.json`, regionsOut);
  write(`${mainOutput}/reads.json`, readsOut);
  write(`${mainOutput}/tags.json`, tagsOut);
  write(`${mainOutput}/tag-values.json`, tagValuesOut);
  write(`${mainOutput}/metadata.json`, metadata);

  console.info("Summary");
  console.info(metadata);
};

/** process projectionist data */
const processProjectionistData = async () => {
  console.info("PROCESSING PROJECTIONIST DATA");

  /** for each ordination, map of sample run to principal components */
  const samplePCs: Record<
    string,
    Record<
      string,
      {
        PC1: number;
        PC2: number;
        PC3: number;
        PC4: number;
        PC5: number;
        PC6: number;
        PC7: number;
        PC8: number;
      }
    >
  > = {};

  /** stream file line by line */
  const samplePCsStream = stream(samplePCsFile);

  /** ignore header */
  await samplePCsStream.next();

  /** process rest of rows (with hard limit) */
  for (let row = 0; row < 1000000; row++) {
    /** show progress periodically */
    if (throttle("data")) console.info(`Processing sample PCs row ${row}`);

    /** read row */
    const { value: sampleRow = [], done: sampleDone } =
      await samplePCsStream.next();

    /** if no more data, exit */
    if (sampleDone) break;

    /** get cols */
    let [
      run = "",
      ,
      PC1 = 0,
      PC2 = 0,
      PC3 = 0,
      PC4 = 0,
      PC5 = 0,
      PC6 = 0,
      PC7 = 0,
      PC8 = 0,
      ordination = "",
    ] = sampleRow;

    /** split PROJECT_SRR to just SRR */
    run = run.split("_").pop() || run;

    /** set sample in ordination */
    samplePCs[ordination] ??= {};
    samplePCs[ordination][run] = {
      PC1: Number(PC1),
      PC2: Number(PC2),
      PC3: Number(PC3),
      PC4: Number(PC4),
      PC5: Number(PC5),
      PC6: Number(PC6),
      PC7: Number(PC7),
      PC8: Number(PC8),
    };
  }

  /** for each ordination, map of taxon to principal components */
  const taxonPCs: Record<
    string,
    Record<
      string,
      {
        PC1: number;
        PC2: number;
        PC3: number;
        PC4: number;
        PC5: number;
        PC6: number;
        PC7: number;
        PC8: number;
      }
    >
  > = {};

  /** stream file line by line */
  const taxonPCsStream = stream(taxonPCsFile);

  /** ignore header */
  await taxonPCsStream.next();

  /** process rest of rows (with hard limit) */
  for (let row = 0; row < 1000000; row++) {
    /** show progress periodically */
    if (throttle("data")) console.info(`Processing taxon PCs row ${row}`);

    /** read row */
    const { value: taxonRow = [], done: taxonDone } =
      await taxonPCsStream.next();

    /** if no more data, exit */
    if (taxonDone) break;

    /** get cols */
    const [
      ,
      ordination = "",
      kingdom = "",
      phylum = "",
      _class = "",
      order = "",
      family = "",
      PC1 = 0,
      PC2 = 0,
      PC3 = 0,
      PC4 = 0,
      PC5 = 0,
      PC6 = 0,
      PC7 = 0,
      PC8 = 0,
    ] = taxonRow;

    /** stringify taxon info into key */
    const taxon = [kingdom, phylum, _class, order, family].join("|");

    /** set taxon */
    taxonPCs[ordination] ??= {};
    taxonPCs[ordination][taxon] = {
      PC1: Number(PC1),
      PC2: Number(PC2),
      PC3: Number(PC3),
      PC4: Number(PC4),
      PC5: Number(PC5),
      PC6: Number(PC6),
      PC7: Number(PC7),
      PC8: Number(PC8),
    };
  }

  /** map of full taxon name to split ranks */
  const taxaMap: Record<
    string,
    {
      /** explicit ranks */
      kingdom: string;
      phylum: string;
      _class: string;
      order: string;
      family: string;
      genus: string;
    }
  > = {};

  /** stream file line by line */
  const taxaMapStream = stream(taxaMapFile);

  /** ignore header */
  await taxaMapStream.next();

  /** process rest of rows (with hard limit) */
  for (let row = 0; row < 1000000; row++) {
    /** show progress periodically */
    if (throttle("data")) console.info(`Processing taxa map row ${row}`);

    /** read row */
    const { value: taxaMapRow = [], done: taxaMapDone } =
      await taxaMapStream.next();

    /** if no more data, exit */
    if (taxaMapDone) break;

    /** get cols */
    const [
      full = "",
      kingdom = "",
      phylum = "",
      _class = "",
      order = "",
      family = "",
      genus = "",
    ] = taxaMapRow;

    /** set taxon */
    taxaMap[full] = { kingdom, phylum, _class, order, family, genus };
  }

  /** save results */
  write(`${projectionistOutput}/sample-pcs.json`, samplePCs);
  write(`${projectionistOutput}/taxon-pcs.json`, taxonPCs);
  write(`${projectionistOutput}/taxa-map.json`, taxaMap);
};

/** run */
await downloadFiles();
await processMainData();
await processProjectionistData();

// eslint-disable-next-line
/// <reference path="./dissolve.d.ts" />

import { execSync } from "child_process";
import { createReadStream, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { chdir } from "process";
import { fileURLToPath } from "url";
import { FeatureCollection, Geometry } from "geojson";
import dissolve from "geojson-dissolve";
import _ from "lodash";
import { parse as parseHTML } from "node-html-parser";
import Downloader from "nodejs-file-downloader";
import papaparse from "papaparse";
import { LD } from "./ld";

/**
 * pre-compile step that takes the "raw" distributed data (csv/tsv), and
 * processs and pares it down to just what the website needs (json).
 */

/** url with JSON-LD containing latest downloads and other metadata */
const metaUrl = "https://doi.org/10.5281/zenodo.8186993";

/** raw taxonomic data */
const taxonomicData = "taxonomic_table.csv";

/** raw sample metadata */
const sampleData = "sample_metadata.tsv";

/** raw natural earth data */
const naturalEarthData =
  "https://rawgit.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
/** https://www.naturalearthdata.com/downloads/110m-cultural-vectors/ */
/** https://github.com/nvkelso/natural-earth-vector/blob/master/geojson */

/**
 * keep these types separate from those in state data. state data types are
 * inferred directly from the JSON files, so they exactly match what will be
 * accessed by the built app. the types here should be spelled out explicitly to
 * define what the script's functions should spit out, and because during
 * dev/testing/changes, the JSON files may be missing/incorrect.
 */

type Metadata = {
  projects: number;
  samples: number;
  phyla: number;
  classes: number;
  countries: number;
  regions: number;
  date: string;
  url: string;
  version: string;
};

type ByTaxLevel = {
  kingdom: string;
  phylum: string;
  _class: string;
  samples: number;
  codes: string[];
}[];

type ByGeo = {
  region: string;
  country: string;
  code: string;
  samples: number;
}[];

type Features = FeatureCollection<Geometry, { [key: string]: string | number }>;

type ByMap = FeatureCollection<Geometry, ByGeo[number]>;

type ByProject = {
  project: string;
  samples: string[];
}[];

type RunToCode = { [key: string]: string };

/** set working directory to directory of this script */
chdir(dirname(fileURLToPath(import.meta.url)));

const lastCall: { [key: string]: number } = {};
/** return true only if enough time has passed since last call */
const throttle = (key: string, interval = 1000) => {
  if (!lastCall[key] || performance.now() > lastCall[key] + interval) {
    lastCall[key] = performance.now();
    return true;
  } else return false;
};

/** fetch json or text */
const request = async <Type>(url: string, type: "json" | "text" = "json") => {
  const options: RequestInit = { redirect: "follow" };
  const response = await fetch(url, options);
  if (!response.ok) throw Error("Response not OK");
  if (type === "text") return (await response.text()) as Type;
  else return (await response.json()) as Type;
};

/** download file */
const download = async (url: string) => {
  const filename = url.split("/").pop() || "";
  console.info(`Downloading ${filename}`);
  await new Downloader({
    url,
    fileName: filename,
    cloneFiles: false,
    maxAttempts: 3,
    onProgress: (percentage, _, remainingSize) => {
      if (!throttle("download")) return;
      const percent = Number(percentage).toFixed(1);
      const remaining = (remainingSize / 1024 / 1024).toFixed(1);
      console.info(`${percent}% done, ${remaining}MB left`);
    },
  }).download();
  console.info(`100% done, 0MB left`);
  if (filename?.endsWith(".gz")) execSync("gzip -d -f " + filename);
};

/** load local csv file by stream */
/** https://stackoverflow.com/questions/63749853/possible-to-make-an-event-handler-wait-until-async-promise-based-code-is-done */
const stream = (url: string) => {
  const dataStream = createReadStream(url);
  const parseStream = papaparse.parse(papaparse.NODE_STREAM_INPUT);
  dataStream.pipe(parseStream);
  return parseStream;
};

/** write local json file */
const write = (filename: string, data: unknown, pretty = false) =>
  writeFileSync(
    filename,
    JSON.stringify(data, null, pretty ? 2 : undefined),
    "utf8",
  );

/** scrape JSON-LD from url */
const getMeta = async (): Promise<LD> => {
  const response = await request<string>(metaUrl, "text");
  const json =
    parseHTML(response).querySelector("script[type='application/ld+json']")
      ?.innerText || "-";
  return JSON.parse(json);
};

/** process taxonomic table data */
const processTaxonomic = async (
  runToCode: RunToCode,
): Promise<{ [key: string]: ByTaxLevel }> => {
  /** map of unique phyla */
  const byPhylum: { [key: string]: ByTaxLevel[number] } = {};
  /** map of unique classes */
  const byClass: { [key: string]: ByTaxLevel[number] } = {};

  /** header row */
  const header: { kingdom: string; phylum: string; _class: string }[] = [];

  let rowIndex = 0;

  /** parse csv one row at a time */
  for await (const row of stream(taxonomicData)) {
    /** show progress periodically */
    if (throttle("taxonomic")) console.info(`Row ${rowIndex}`);

    /** whether row (sample) has already been counted toward taxon */
    const phylumCounted: { [key: string]: boolean } = {};
    const classCounted: { [key: string]: boolean } = {};

    /** loop through columns */
    for (let colIndex = 2; colIndex < row.length; colIndex++) {
      const cell = row[colIndex];

      /** fill out header row */
      if (rowIndex === 0) {
        const [kingdom = "", phylum = "", _class = ""] = cell.split(".");
        header.push({ kingdom, phylum, _class });
      } else {
        /** get props from header row */
        const { kingdom, phylum, _class } = header[colIndex - 2];
        const [, sample] = row[1].split("_");

        /** if taxon present in sample */
        if (cell !== "0") {
          /** count sample toward phylum (if not already) */
          if (!phylumCounted[phylum]) {
            if (!byPhylum[phylum])
              byPhylum[phylum] = {
                kingdom,
                phylum,
                _class: "",
                samples: 0,
                codes: [],
              };
            byPhylum[phylum].samples++;
            /** include country code from sample meta */
            if (!byPhylum[phylum].codes.includes(runToCode[sample]))
              byPhylum[phylum].codes.push(runToCode[sample]);
            phylumCounted[phylum] = true;
          }

          /** count sample toward class (if not already) */
          if (!classCounted[_class]) {
            if (!byClass[_class])
              byClass[_class] = {
                kingdom,
                phylum,
                _class,
                samples: 0,
                codes: [],
              };
            byClass[_class].samples++;
            /** include country code from sample meta */
            if (!byClass[_class].codes.includes(runToCode[sample]))
              byClass[_class].codes.push(runToCode[sample]);
            classCounted[_class] = true;
          }
        }
      }
    }

    rowIndex++;
  }

  return {
    byPhylum: Object.values(byPhylum).sort((a, b) => b.samples - a.samples),
    byClass: Object.values(byClass).sort((a, b) => b.samples - a.samples),
  };
};

/** process sample metadata */
const processSample = async (): Promise<{
  byProject: ByProject;
  countries: ByGeo;
  runToCode: RunToCode;
}> => {
  /** map of sample run names to country code */
  const runToCode: RunToCode = {};
  /** map of unique projects */
  const byProject: { [key: ByProject[number]["project"]]: ByProject[number] } =
    {};
  /** map of unique countries */
  const countries: { [key: ByGeo[number]["country"]]: ByGeo[number] } = {};

  let rowIndex = 0;
  for await (const row of stream(sampleData)) {
    if (rowIndex++ === 0) continue;

    /** project and sample info */
    const [sample, project, run] = row;
    if (!byProject[project]) byProject[project] = { project, samples: [] };
    byProject[project].samples.push(sample);

    /** geography info */
    const country = _.startCase((row.at(-3) || "").split(":").pop());
    const code = row.at(-2) || "";
    const region = row.at(-1) || "";
    if (!countries[code])
      countries[code] = { region, country, code, samples: 0 };
    countries[code].samples++;

    /** save code for sample run */
    runToCode[run] = code;
  }

  return {
    byProject: Object.values(byProject),
    countries: Object.values(countries),
    runToCode,
  };
};

/** process world map data */
const processWorldMap = async (): Promise<ByMap> => {
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

/** process "by geography" data */
const processByGeographic = (
  worldMap: ByMap,
  countries: ByGeo,
  byRegion = false,
): ByMap => {
  const data = _.cloneDeep(worldMap);

  /** lookup sample count from matching country, keep existing properties */
  for (const { properties } of data.features)
    properties.samples =
      countries.find((country) => properties.code === country.code)?.samples ||
      0;

  /** merge features by region geographic data */
  if (byRegion) {
    /** map of region to feature */
    const regions: { [key: string]: ByMap["features"][number] } = {};

    for (const feature of data.features) {
      /** catch countries without regions */
      if (!feature.properties.region) {
        regions[feature.properties.code] = feature;
        continue;
      }

      /** get existing entry */
      let existing = regions[feature.properties.region];

      if (existing) {
        /** merge entry */
        existing.geometry = dissolve([existing, feature]);
        existing.properties.samples += feature.properties.samples;
      } else
      /** set new entry */
        existing = feature;

      /** unset country-specific details */
      existing.properties.country = "";
      existing.properties.code = "";

      /** set entry */
      regions[feature.properties.region] = existing;
    }

    /** map back to array */
    data.features = Object.values(regions);
  }

  return data;
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
(async () => {
  console.info("Getting data download links and meta");
  const ld = await getMeta();

  // console.info("Downloading raw data");
  // for (const { contentUrl } of ld.distribution) await download(contentUrl);

  console.info("Transform sample metadata");
  const { byProject, countries, runToCode } = await processSample();
  write("../public/by-project.json", byProject);

  console.info("Transforming taxonomic table data");
  const { byPhylum, byClass } = await processTaxonomic(runToCode);
  write("../public/by-phylum.json", byPhylum);
  write("../public/by-class.json", byClass);

  console.info("Getting and cleaning world map data");
  const worldMap = await processWorldMap();

  console.info("Merging country and region data with world map data");
  const byCountry = processByGeographic(worldMap, countries);
  const byRegion = processByGeographic(worldMap, countries, true);
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
})();

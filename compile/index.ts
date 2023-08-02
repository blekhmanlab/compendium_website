// eslint-disable-next-line
/// <reference path="./dissolve.d.ts" />

import { execSync } from "child_process";
import { createReadStream, writeFileSync } from "fs";
import { memoryUsage } from "node:process";
import { dirname } from "path";
import { chdir } from "process";
import { fileURLToPath } from "url";
import type { ByMap } from "../src/data";
import progress from "cli-progress";
import { FeatureCollection } from "geojson";
import dissolve from "geojson-dissolve";
import _ from "lodash";
import { parse } from "node-html-parser";
import Downloader from "nodejs-file-downloader";
import papaparse from "papaparse";
import { LD } from "./ld";

/**
 * pre-compile step that takes the "raw" distributed data (csv/tsv), and
 * transforms and pares it down to just what the website needs (json).
 */

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
  name: string;
  kingdom: string;
  phylum: string;
  _class: string;
  // order: string;
  // family: string;
  // genus: string;
  // species: string;
  samples: number;
}[];

type ByGeo = {
  code: string;
  name: string;
  samples: number;
  region: string;
}[];

type ByProject = {
  project: string;
  samples: string[];
}[];

/** JSON-LD with latest downloads and other metadata */
const ld = "https://doi.org/10.5281/zenodo.8186993";

/** https://www.naturalearthdata.com/downloads/110m-cultural-vectors/ */
/** https://github.com/nvkelso/natural-earth-vector/blob/master/geojson */
const naturalEarth =
  "https://rawgit.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

type CSV = string[][];

/** set working directory to directory of this script */
chdir(dirname(fileURLToPath(import.meta.url)));

/** fetch json */
const request = async <Type>(url: string, type: "json" | "text" = "json") => {
  const options: RequestInit = { redirect: "follow" };
  const response = await fetch(url, options);
  if (!response.ok) throw Error("Response not OK");
  if (type === "text") return (await response.text()) as Type;
  else return (await response.json()) as Type;
};

/** download file */
const download = async (url: string) => {
  const filename = url.split("/").pop();
  const bar = new progress.SingleBar({
    format: [
      "{filename}",
      "{bar}",
      "{percentage}%",
      "{remaining}MB",
      "{eta_formatted}",
    ].join(" | "),
  });
  bar.start(100, 0, { filename, remaining: "???" });
  await new Downloader({
    url,
    fileName: filename,
    cloneFiles: false,
    maxAttempts: 3,
    onProgress: (percentage, _, remainingSize) => {
      const percent = Number(percentage);
      bar.update(percent, {
        filename,
        remaining: (remainingSize / 1024 / 1024).toFixed(2),
      });
    },
  }).download();
  bar.stop();
  if (filename?.endsWith(".gz")) execSync("gzip -d -f " + filename);
};

/** load local csv file */
const load = async <Type>(url: string): Promise<Type> =>
  new Promise((resolve) => {
    const results: unknown[] = [];
    const stream = createReadStream(url);
    papaparse.parse(stream, {
      delimiter: ",",
      step: (row) => results.push(row.data),
      complete: () => resolve(results as Type),
    });
  });

/** write local json file */
const write = (filename: string, data: unknown, pretty = false) =>
  writeFileSync(
    filename,
    JSON.stringify(data, null, pretty ? 2 : undefined),
    "utf8",
  );

/** scrape JSON-LD from zenodo site */
const getLd = async (): Promise<LD> => {
  const response = await request<string>(ld, "text");
  const json =
    parse(response).querySelector("script[type='application/ld+json']")
      ?.innerText || "-";
  return JSON.parse(json);
};

/** transform "by taxonomic level" data */
const transformByTaxonomic = (csv: CSV): { [key: string]: ByTaxLevel } => {
  const data: ByTaxLevel = [];

  for (let col = 2; col < csv[0].length; col++) {
    const [
      kingdom = "",
      phylum = "",
      _class = "",
      // order = "",
      // family = "",
      // genus = "",
      // species = "",
    ] = csv[0][col].split(".");

    /** count number of non-zero rows in col */
    let samples = 0;
    for (let row = 1; row < csv.length; row++)
      if (csv[row][col] !== "0") samples++;

    data.push({
      name: "",
      kingdom,
      phylum,
      _class,
      samples,
    });
  }

  /** sort by sample count */
  data.sort((a, b) => b.samples - a.samples);

  /** types for grouping */
  type Entry = ByTaxLevel[number];

  /** group by phylum */
  const byPhylum: { [key: Entry["phylum"]]: Entry } = {};
  const byClass: { [key: Entry["_class"]]: Entry } = {};

  for (const datum of data) {
    /** group by class */
    if (byClass[datum._class]) byClass[datum._class].samples += datum.samples;
    else byClass[datum._class] = { ...datum, name: datum._class, samples: 1 };

    /** group by phylum */
    if (byPhylum[datum.phylum]) byPhylum[datum.phylum].samples++;
    else
      byPhylum[datum.phylum] = {
        ...datum,
        _class: "",
        name: datum.phylum,
        samples: 1,
      };
  }

  return { byPhylum: Object.values(byPhylum), byClass: Object.values(byClass) };
};

/** extract projects and samples from classes data */
const getProjects = (csv: CSV): ByProject => {
  /** make map of unique projects */
  const projects: { [key: string]: string[] } = {};

  /** go through rows and split out project and sample */
  for (let row = 1; row < csv.length; row++) {
    const [project = "", sample = ""] = csv[row][0].split("_");
    if (!projects[project]) projects[project] = [];
    projects[project].push(sample);
  }

  /** transform into desired data structure */
  return Object.entries(projects).map(([project, samples]) => ({
    project,
    samples,
  }));
};

/** transform world map data */
const transformWorldMap = (data: FeatureCollection): FeatureCollection => {
  /** filter out missing/nullish */
  const clean = (value: unknown) => {
    if (typeof value !== "string") return "";
    if (["-99"].includes(value)) return "";
    return value;
  };

  /** only keep needed properties (opt-in) */
  for (const feature of data.features || [])
    feature.properties = {
      code: (
        clean(feature.properties?.ISO_A2) ||
        clean(feature.properties?.ISO_A2_EH) ||
        clean(feature.properties?.ADM0_ISO) ||
        clean(feature.properties?.ADM0_A3) ||
        ""
      ).toUpperCase(),
      name: _.startCase(clean(feature.properties?.NAME) || ""),
    };

  return data;
};

/** transform country and region data */
const transformCountries = (countries: CSV, regions: CSV): ByGeo => {
  /** map of country code to full country details */
  const map: { [key: string]: ByGeo[number] } = {};

  /** add countries from regions.csv */
  for (let row = 1; row < regions.length; row++) {
    const [code, name, region] = regions[row];
    map[code] = { code, name: _.startCase(name), samples: 0, region };
  }

  /** add countries from countries.csv */
  for (let row = 1; row < countries.length; row++) {
    const code = countries[row][1] || "";
    const [name = ""] = countries[row][2].split(":") || [];
    map[code] = {
      code: map[code]?.code || code,
      name: map[code]?.name || _.startCase(name),
      samples: (map[code]?.samples || 0) + 1,
      region: map[code]?.region || "",
    };
  }

  /** filter out missing/nullish */
  const exclude = [
    "labcontrol test",
    "missing",
    "n/a",
    "na",
    "not applicable",
    "not available",
    "not collected",
    "unknown",
    "unspecified",
  ];

  const data = Object.values(map).filter(
    ({ name, code }) => !(exclude.includes(name) || exclude.includes(code)),
  );

  return data;
};

/** transform "by geography" data */
const transformByGeographic = (
  worldMap: FeatureCollection,
  countries: ByGeo,
  byRegion = false,
): ByMap => {
  const data = {
    ...worldMap,
    features: worldMap.features.map((feature) => {
      /** find matching country in geographic data */
      const match = countries.find((d) => d.code === feature.properties?.code);
      return {
        ...feature,
        properties: {
          code: match?.code || feature.properties?.code || "",
          name: match?.name || feature.properties?.name || "",
          samples: match?.samples || 0,
          region: match?.region || "",
        },
      };
    }),
  };

  /** merge features by region geographic data */
  if (byRegion) {
    /** (key/value) map of region to feature */
    const regions = new Map<string, ByMap["features"][number]>();

    for (const feature of data.features) {
      /** catch countries without regions */
      if (!feature.properties?.region) {
        regions.set(
          feature.properties?.code || feature.properties?.name,
          feature,
        );
        continue;
      }

      /** get existing entry */
      let existing = regions.get(feature.properties?.region);

      if (existing) {
        /** merge entry */
        existing.geometry = dissolve([existing, feature]);
        existing.properties.samples += feature.properties?.samples;
      } else
      /** set new entry */
        existing = feature;

      /** unset country-specific details */
      existing.properties.code = "";
      existing.properties.name = "";

      /** set entry */
      regions.set(feature.properties?.region, existing);
    }

    /** map back to array */
    data.features = [...regions.values()];
  }

  return data;
};

/** derive metadata about data */
const deriveMetadata = (
  byClass: ByTaxLevel,
  byPhylum: ByTaxLevel,
  byCountry: ByMap,
  byRegion: ByMap,
  byProject: ByProject,
  ld: LD,
): Metadata => {
  const projects = byProject.length;
  const samples = byProject.reduce(
    (total, { samples }) => total + samples.length,
    0,
  );
  const phyla = byPhylum.filter((tax) => tax.samples).length;
  const classes = byClass.filter((tax) => tax.samples).length;
  const countries = byCountry.features.filter(
    (feature) => feature.properties.samples,
  ).length;
  const regions = byRegion.features.filter(
    (feature) => feature.properties.samples,
  ).length;

  return {
    projects,
    samples,
    phyla,
    classes,
    countries,
    regions,
    date: ld.datePublished,
    url: ld["@id"],
    version: ld.version,
  };
};

/** main workflow */
(async () => {
  // console.info("Getting JSON-LD");
  // const ld = await getLd();

  // console.info("Downloading raw data");
  // for (const { contentUrl } of ld.distribution) await download(contentUrl);

  console.info("Computing taxonomic level data");
  const taxaCsv = await load<CSV>("taxonomic_table.csv");
  const { byPhylum, byClass } = transformByTaxonomic(taxaCsv);
  write("../public/by-phylum.json", byPhylum);
  write("../public/by-class.json", byClass);

  // console.info("Getting projects and samples");
  // const byProject = getProjects(classesCsv);
  // write("../public/by-project.json", byProject);

  // console.info("Getting and cleaning world map data");
  // const worldMap = transformWorldMap(
  //   await request<FeatureCollection>(naturalEarth),
  // );

  // console.info("Computing country and region data");
  // const countriesCsv = await load<CSV>("countries.csv");
  // const regionsCsv = await load<CSV>("regions.csv");
  // const countries = transformCountries(countriesCsv, regionsCsv);

  // console.info("Merging country data with world map data");
  // const byCountry = transformByGeographic(worldMap, countries);
  // const byRegion = transformByGeographic(worldMap, countries, true);
  // write("../public/by-country.json", byCountry);
  // write("../public/by-region.json", byRegion);

  // console.info("Deriving metadata");
  // const metadata = deriveMetadata(
  //   byPhylum,
  //   byClass,
  //   byCountry,
  //   byRegion,
  //   byProject,
  //   ld,
  // );
  // write("../public/metadata.json", metadata, true);
})();

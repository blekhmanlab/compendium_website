// eslint-disable-next-line
/// <reference path="./dissolve.d.ts" />

import { readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { chdir } from "process";
import { fileURLToPath } from "url";
import type {
  ByGeo,
  ByMap,
  ByProject,
  ByTaxLevel,
  Metadata,
} from "../src/data";
import { FeatureCollection } from "geojson";
import dissolve from "geojson-dissolve";
import _ from "lodash";
import papaparse from "papaparse";

type CSV = string[][];

/** set working directory to directory of this script */
chdir(dirname(fileURLToPath(import.meta.url)));

/** fetch json */
const request = async <Type>(url: string): Promise<Type> => {
  const response = await fetch(url);
  if (!response.ok) throw Error("Response not OK");
  const data = await response.json();
  return data;
};

/** load local csv file */
const load = async <Type>(url: string): Promise<Type> =>
  (await papaparse.parse(readFileSync(url, "utf8").trim())).data as Type;

/** write local json file */
const write = (filename: string, data: unknown) =>
  writeFileSync("../public/" + filename, JSON.stringify(data), "utf8");

/** transform "by taxonomic level" data */
const transformByTaxonomic = (csv: CSV): ByTaxLevel => {
  const data: ByTaxLevel = [];

  for (let col = 1; col < csv[0].length; col++) {
    const fullName = csv[0][col];
    /** get parts from full name */
    const [kingdom = "", phylum = "", _class = ""] = fullName.split(".");
    /** get name from most specific part */
    const name = _class || phylum || kingdom;
    /** skip NA */
    if (name === "NA") continue;

    /** count number of non-zero rows in col */
    let samples = 0;
    for (let row = 1; row < csv.length; row++)
      if (csv[row][col] !== "0") samples++;

    data.push({ fullName, name, kingdom, phylum, _class, samples });
  }

  /** sort by sample count */
  data.sort((a, b) => b.samples - a.samples);

  return data;
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
    ({ name, code }) => !(exclude.includes(name) || exclude.includes(code))
  );

  return data;
};

/** transform "by geography" data */
const transformByGeographic = (
  worldMap: FeatureCollection,
  countries: ByGeo,
  byRegion = false
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
          feature
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

/** https://www.naturalearthdata.com/downloads/110m-cultural-vectors/ */
/** https://github.com/nvkelso/natural-earth-vector/blob/master/geojson */
const naturalEarth =
  "https://rawgit.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

/** derive metadata about data */
const deriveMetadata = (
  byClass: ByTaxLevel,
  byPhylum: ByTaxLevel,
  byCountry: ByMap,
  byRegion: ByMap,
  byProject: ByProject
): Metadata => {
  const classes = byClass.filter((tax) => tax.samples).length;
  const phyla = byPhylum.filter((tax) => tax.samples).length;
  const countries = byCountry.features.filter(
    (feature) => feature.properties.samples
  ).length;
  const regions = byRegion.features.filter(
    (feature) => feature.properties.samples
  ).length;
  const samples = byProject.reduce(
    (total, { samples }) => total + samples.length,
    0
  );
  const projects = byProject.length;

  return {
    classes,
    phyla,
    countries,
    regions,
    samples,
    projects,
    size: "1.1 GB",
  };
};

/** main workflow */
(async () => {
  console.info("Computing 'by class' taxonomic level data");
  const classesCsv = await load<CSV>("classes.csv");
  const byClass = transformByTaxonomic(classesCsv);
  write("../public/by-class.json", byClass);

  console.info("Computing 'by phylum' taxonomic level data");
  const phylaCsv = await load<CSV>("phyla.csv");
  const byPhylum = transformByTaxonomic(phylaCsv);
  write("../public/by-phylum.json", byPhylum);

  console.info("Getting projects and samples");
  const byProject = getProjects(classesCsv);
  write("../public/by-project.json", byProject);

  console.info("Getting and cleaning world map data");
  const worldMap = transformWorldMap(
    await request<FeatureCollection>(naturalEarth)
  );

  console.info("Computing country and region data");
  const countriesCsv = await load<CSV>("countries.csv");
  const regionsCsv = await load<CSV>("regions.csv");
  const countries = transformCountries(countriesCsv, regionsCsv);

  console.info("Merging country data with world map data");
  const byCountry = transformByGeographic(worldMap, countries);
  const byRegion = transformByGeographic(worldMap, countries, true);
  write("../public/by-country.json", byCountry);
  write("../public/by-region.json", byRegion);

  console.info("Deriving metadata");
  const metadata = deriveMetadata(
    byClass,
    byPhylum,
    byCountry,
    byRegion,
    byProject
  );
  write("../public/metadata.json", metadata);
})();

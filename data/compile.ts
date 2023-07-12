// eslint-disable-next-line
/// <reference path="./dissolve.d.ts" />

import { readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { chdir } from "process";
import { fileURLToPath } from "url";
import type {
  CSV,
  GeographicPrevalence,
  MapPrevalence,
  TaxonomicPrevalence,
} from "../src/data";
import { FeatureCollection } from "geojson";
import dissolve from "geojson-dissolve";
import _ from "lodash";
import papaparse from "papaparse";

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
const transformByTaxonomic = (csv: CSV): TaxonomicPrevalence => {
  const data: TaxonomicPrevalence = [];

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
const transformCountries = (
  countries: CSV,
  regions: CSV
): GeographicPrevalence => {
  /** map of country code to full country details */
  const map: { [key: string]: GeographicPrevalence[0] } = {};

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
  countries: GeographicPrevalence,
  byRegion = false
): MapPrevalence => {
  const data: MapPrevalence = {
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
    const regions = new Map<string, MapPrevalence["features"][0]>();

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

/** main workflow */
(async () => {
  console.info("Computing 'by class' taxonomic level data");
  const classesCsv = await load<CSV>("classes.csv");
  const byClass = transformByTaxonomic(classesCsv);
  write("../public/by-class.json", byClass);

  console.info("Computing 'by phyla' taxonomic level data");
  const phylaCsv = await load<CSV>("phyla.csv");
  const byPhlya = transformByTaxonomic(phylaCsv);
  write("../public/by-phyla.json", byPhlya);

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
})();

import { CSV, GeographicPrevalence, TaxonomicPrevalence } from "./";
import { expose } from "comlink";
import { FeatureCollection } from "geojson";
import { startCase } from "lodash";
import { parse as parseCsv } from "papaparse";

/**
 * every time you communicate with a web worker, the message content must be
 * serialized/deserialized, which takes a long time with large data. therefore,
 * keep as much computation in this file as possible, and prune data as much as
 * possible before returning.
 */

/** fetch file and parse as json/csv/text */
export const parse = async <Type>(
  url: string,
  type: "json" | "csv"
): Promise<Type> => {
  progress?.("Fetching");

  if (!url.startsWith("http")) url = import.meta.env.BASE_URL + url;

  const headers = new Headers();
  headers.set("Accept-Encoding", "gzip, deflate, br");

  const response = await fetch(url, { headers });
  if (!response.ok) throw Error("Response not OK");

  let data;

  if (type === "json") {
    progress?.("Parsing as json");
    data = await response.json();
  } else {
    progress?.("Parsing as text");
    data = await response.text();
  }

  if (type === "csv") {
    progress?.("Parsing as csv");
    data = (await parseCsv(data.trim())).data;
  }

  return data;
};

/** get taxonomic data */
export const getTaxonomic = async (
  url: string
): Promise<TaxonomicPrevalence> => {
  const csv = await parse<CSV>(url, "csv");

  progress?.("Transforming data");

  const data: TaxonomicPrevalence = [];

  for (let col = 1; col < csv[0].length; col++) {
    const fullName = String(csv[0][col] || "");
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

  return data.slice(0, 15);
};

/** get world geojson data */
/** https://www.naturalearthdata.com/downloads/110m-cultural-vectors/ */
/** https://github.com/nvkelso/natural-earth-vector/blob/master/geojson */
const world =
  "https://rawgit.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
export const getWorld = async (): Promise<FeatureCollection> => {
  const data = await parse<FeatureCollection>(world, "json");

  progress?.("Transforming data");

  /** filter out missing/nullish */
  const clean = (value: unknown) => {
    if (typeof value !== "string") return "";
    if (["-99"].includes(value)) return "";
    return value;
  };

  /** clean up properties */
  for (const feature of data.features || []) {
    if (feature.properties) {
      feature.properties.code = (
        clean(feature.properties.ISO_A2) ||
        clean(feature.properties.ISO_A2_EH) ||
        clean(feature.properties.ADM0_ISO) ||
        clean(feature.properties.ADM0_A3) ||
        ""
      ).toUpperCase();
      feature.properties.name = startCase(clean(feature.properties.NAME) || "");
    }
  }

  return data;
};

/** get geographic data */
const countries = "countries.csv";
const regions = "regions.csv";
export const getGeographic = async (): Promise<GeographicPrevalence> => {
  const countriesCsv = await parse<CSV>(countries, "csv");
  const regionsCsv = await parse<CSV>(regions, "csv");

  progress?.("Transforming data");

  /** map of country code to full country details */
  const map: { [key: string]: GeographicPrevalence[0] } = {};

  /** add countries from regions.csv */
  for (let row = 1; row < regionsCsv.length; row++) {
    const [code, name, region] = regionsCsv[row];
    map[code] = { code, name: startCase(name), samples: 0, region };
  }

  /** add countries from countries.csv */
  for (let row = 1; row < countriesCsv.length; row++) {
    const code = countriesCsv[row][1] || "";
    const [name = ""] = countriesCsv[row][2].split(":") || [];
    map[code] = {
      code: map[code]?.code || code,
      name: map[code]?.name || startCase(name),
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

  return Object.values(map).filter(
    ({ name, code }) => !(exclude.includes(name) || exclude.includes(code))
  );
};

/** progress callback */
type OnProgress = (status: string) => void;

/** currently set progress callback */
let progress: OnProgress | undefined;

/** expose method to set progress callback */
export const onProgress = (callback: OnProgress) => (progress = callback);

expose({ parse, getTaxonomic, getWorld, getGeographic, onProgress });

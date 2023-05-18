import { CountryPrevalence, CSV, TaxonomicPrevalence } from "./";
import { expose } from "comlink";
import { FeatureCollection } from "geojson";
import { parse } from "papaparse";

/**
 * every time you communicate with a web worker, the message content must be
 * serialized/deserialized, which takes a long time with large data. therefore,
 * keep as much computation in this file as possible, and prune data as much as
 * possible before returning.
 */

/** fetch file and parse as csv */
export const parseCsv = async (url: string): Promise<CSV> => {
  progress?.("Fetching");

  const headers = new Headers();
  headers.set("Accept-Encoding", "gzip, deflate, br");

  const response = await fetch(import.meta.env.BASE_URL + url, { headers });
  if (!response.ok) throw Error("Response not OK");

  progress?.("Parsing text");
  const text = await response.text();

  progress?.("Parsing csv");
  const parsed = await parse(text.trim());
  const data = parsed.data as CSV;

  return data;
};

/** parse csv with "by table" format */
export const getTable = async (url: string): Promise<TaxonomicPrevalence> => {
  const csv = await parseCsv(url);

  progress?.("Parsing table");

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

/** fetch world geojson data */
/** https://www.naturalearthdata.com/downloads/110m-cultural-vectors/ */
/** https://github.com/nvkelso/natural-earth-vector/blob/master/geojson */
const map =
  "https://rawgit.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
export const getWorld = async (): Promise<FeatureCollection> => {
  progress?.("Fetching");

  const response = await fetch(map);
  if (!response.ok) throw Error("Response not OK");

  progress?.("Parsing json");
  const json = await response.json();

  return json;
};

/** parse countries data format */
export const getCountries = async (url: string): Promise<CountryPrevalence> => {
  const csv = await parseCsv(url);

  progress?.("Parsing table");

  const data: { [key: string]: number } = {};

  /** count samples in each country */
  for (let row = 1; row < csv.length; row++) {
    const code = csv[row][1] || "";
    const name = csv[row][2].split(":")[0] || "";
    const key = code + ":" + name;
    data[key] ??= 0;
    data[key]++;
  }

  /** split back out country code and full name */
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
  return Object.entries(data)
    .map(([key, samples]) => {
      const [code, name] = key.split(":");
      return { code: code.toUpperCase(), name: name.toLowerCase(), samples };
    })
    .filter(
      ({ name, code }) => !(exclude.includes(name) || exclude.includes(code))
    );
};

/** progress callback */
type OnProgress = (status: string) => void;

/** currently set progress callback */
let progress: OnProgress | undefined;

/** expose method to set progress callback */
export const onProgress = (callback: OnProgress) => (progress = callback);

expose({ parseCsv, getTable, getWorld, getCountries, onProgress });

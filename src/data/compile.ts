import { readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { chdir } from "process";
import { fileURLToPath } from "url";
import papaparse from "papaparse";
import { CSV, TaxonomicPrevalence } from "@/data";

/** set working directory to directory of this script */
chdir(dirname(fileURLToPath(import.meta.url)));

/** fetch json */
// const request = async <Type>(url: string): Promise<Type> => {
//   const response = await fetch(url);
//   if (!response.ok) throw Error("Response not OK");
//   const data = await response.json();
//   return data;
// };

/** load local csv file */
const load = async <Type>(url: string): Promise<Type> =>
  (await papaparse.parse(readFileSync(url, "utf8").trim())).data as Type;

/** write local json file */
const write = (filename: string, data: unknown) =>
  writeFileSync(filename, JSON.stringify(data), "utf8");

/** get taxonomic data */
const getTaxonomic = async (url: string) => {
  const csv = await load<CSV>(url);

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

  /** write results to json file */
  write(url.replace(".csv", ".json"), data.slice(0, 100));
};

getTaxonomic("classes.csv");
getTaxonomic("phyla.csv");

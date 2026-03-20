import { pick } from "lodash";
import { parse } from "papaparse";
import { request } from "@/util/async";

/** parse tsv/csv file */
export const getTable = async <Response>(url: string) =>
  parse<Response>((await request(url, "text")).trim(), {
    dynamicTyping: true,
    header: true,
  }).data;

/** convert taxon object to string for easier compare/lookup/etc */
export const stringifyTaxon = (value: object | string) =>
  typeof value === "object"
    ? JSON.stringify(
        pick(value, ["kingdom", "phylum", "class", "order", "family", "genus"]),
      )
    : value;

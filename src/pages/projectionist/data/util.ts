import { pick } from "lodash";
import { parse } from "papaparse";
import { request } from "@/util/async";

/** parse tsv/csv file */
export const getTable = async <Response>(url: string) => {
  const content = (await request(url, "text")).trim();
  const { data } = parse<Response>(content, {
    dynamicTyping: true,
    header: true,
  });
  return data;
};

/** convert taxon object to string for easier compare/lookup/etc */
export const stringifyTaxon = (value: object | string) =>
  typeof value === "object"
    ? JSON.stringify(
        pick(value, ["kingdom", "phylum", "class", "order", "family", "genus"]),
      )
    : value;

import type { record } from "udsv";
import { pick } from "lodash";
import { inferSchema, initParser } from "udsv";
import { request } from "@/util/async";

/** parse tsv/csv file */
export const getTable = async <Response extends record>(url: string) => {
  const content = (await request(url, "text")).trim();
  const schema = inferSchema(content);
  const parser = initParser(schema);
  return parser.typedObjs<Response>(content);
};

/** convert taxon object to string for easier compare/lookup/etc */
export const stringifyTaxon = (value: object | string) =>
  typeof value === "object"
    ? JSON.stringify(
        pick(value, ["kingdom", "phylum", "class", "order", "family", "genus"]),
      )
    : value;

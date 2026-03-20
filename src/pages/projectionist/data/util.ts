import { parse } from "papaparse";
import { request } from "@/util/async";

/** parse tsv/csv file */
export const getTable = async <Response>(url: string) =>
  parse<Response>(await request(url, "text"), {
    dynamicTyping: true,
    header: true,
  }).data;

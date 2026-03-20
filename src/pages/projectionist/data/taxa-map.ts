import { expose } from "comlink";
import { getTable } from "@/pages/projectionist/data/util";
import url from "./taxa-map.tsv?url";

type TaxaMapRow = {
  /** full taxon name */
  taxon: string;
  /** explicit ranks */
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
};

export type TaxaMap = Awaited<ReturnType<typeof getTaxaMap>>;

/** map of full taxon name to split ranks */
export const getTaxaMap = async () => {
  const data = await getTable<TaxaMapRow>(url);
  console.debug(data);
  return Object.fromEntries(data.map(({ taxon, ...row }) => [taxon, row]));
};

expose({ getTaxaMap });

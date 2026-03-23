import { expose } from "comlink";
import { request } from "@/util/async";
import taxaMapUrl from "./taxa-map.json?url";

/** map of full taxon name to split ranks */
export type TaxaMap = Record<
  string,
  {
    kingdom: string;
    phylum: string;
    _class: string;
    order: string;
    family: string;
    genus: string;
  }
>;

/** get taxa map */
export const getTaxaMap = async () => request<TaxaMap>(taxaMapUrl);

expose({ getTaxaMap });

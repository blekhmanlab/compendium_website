import type ByClassType from "./by-class.json";
import type ByPhylumType from "./by-phylum.json";
import { expose } from "comlink";
import { request } from "@/util/async";
import byClassUrl from "./by-class.json?url";
import byPhylumUrl from "./by-phylum.json?url";
import { cleanSearch } from "./util";

/** by class taxonomic level */
export type ByClass = typeof ByClassType;
/** by phylum taxonomic level */
export type ByPhylum = typeof ByPhylumType;

export type TaxaSearch = {
  name: string;
  type: "Phylum" | "Class";
  samples: number;
  fuzzy?: boolean;
}[];

/** by-phylum/by-class */
export const getTaxa = async () => {
  const [byPhylum, byClass] = await Promise.all([
    request<ByPhylum>(byPhylumUrl),
    request<ByClass>(byClassUrl),
  ]);
  return { byPhylum, byClass };
};

/** derive search-friendly list (too big to load pre-compiled) */
export const getTaxaSearch = async ({
  byPhylum,
  byClass,
}: {
  byPhylum: ByPhylum;
  byClass: ByClass;
}) => {
  /** derive search-friendly list (too big to load pre-compiled) */
  const list: TaxaSearch = [];

  /** include phyla */
  for (const { phylum, samples } of byPhylum)
    list.push({ type: "Phylum", name: phylum, samples: samples.total });

  /** include classes */
  for (const { _class, samples } of byClass)
    list.push({ type: "Class", name: _class, samples: samples.total });

  return { taxaSearch: cleanSearch(list) };
};

expose({ getTaxa, getTaxaSearch });

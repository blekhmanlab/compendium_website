import type ClassesType from "./classes.json";
import type PhylaType from "./phyla.json";
import { expose } from "comlink";
import { request } from "@/util/async";
import classesUrl from "./classes.json?url";
import phylaUrl from "./phyla.json?url";
import { cleanSearch } from "./util";

/** by class taxonomic level */
export type Classes = typeof ClassesType;
/** by phylum taxonomic level */
export type Phyla = typeof PhylaType;

export type TaxonSearch = {
  name: string;
  type: "Phylum" | "Class";
  samples: number;
  fuzzy?: boolean;
}[];

/** phyla/classes */
export const getTaxa = async () => {
  const [phyla, classes] = await Promise.all([
    request<Phyla>(phylaUrl),
    request<Classes>(classesUrl),
  ]);
  return { phyla, classes };
};

/** derive search-friendly list (too big to load pre-compiled) */
export const getTaxonSearch = async ({
  phyla,
  classes,
}: {
  phyla: Phyla;
  classes: Classes;
}) => {
  /** derive search-friendly list (too big to load pre-compiled) */
  const list: TaxonSearch = [];

  /** include phyla */
  for (const { phylum, samples } of phyla)
    list.push({ type: "Phylum", name: phylum, samples: samples.total });

  /** include classes */
  for (const { _class, samples } of classes)
    list.push({ type: "Class", name: _class, samples: samples.total });

  return { taxonSearch: cleanSearch(list) };
};

expose({ getTaxa, getTaxonSearch });

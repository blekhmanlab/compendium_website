import type { Compendium } from "@/pages/home/state";
import { expose } from "comlink";
import { mapKeys } from "lodash";
import { request } from "@/util/async";
import { cleanSearch } from "./util";

/** import all classes urls */
const classesUrls = mapKeys(
  import.meta.glob<string>("./*/classes.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => path.match(/([^/]+)\/classes\.json$/)?.[1] ?? "",
);

/** import all phyla urls */
const phylaUrls = mapKeys(
  import.meta.glob<string>("./*/phyla.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => path.match(/([^/]+)\/phyla\.json$/)?.[1] ?? "",
);

/** by class taxonomic level */
export type Classes = {
  kingdom: string;
  phylum: string;
  _class: string;
  samples: {
    total: number;
    [key: string]: number;
  };
}[];

/** by phylum taxonomic level */
export type Phyla = {
  kingdom: string;
  phylum: string;
  _class: string;
  samples: {
    total: number;
    [key: string]: number;
  };
}[];

export type TaxonSearch = {
  name: string;
  type: "Phylum" | "Class";
  samples: number;
  fuzzy?: boolean;
}[];

export const getTaxa = async (compendium: Compendium) => {
  const [phyla, classes] = await Promise.all([
    request<Phyla>(phylaUrls[compendium] ?? ""),
    request<Classes>(classesUrls[compendium] ?? ""),
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

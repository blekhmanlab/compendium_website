import { expose } from "comlink";
import { getTable } from "@/pages/projectionist/data/util";
import url from "./taxon-weights.tsv?url";

type TaxonWeightsRow = {
  /** taxon ranks */
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  /** principal component values */
  PC1: number;
  PC2: number;
  PC3: number;
  PC4: number;
  PC5: number;
  PC6: number;
  PC7: number;
  PC8: number;
};

export type TaxonWeights = Awaited<ReturnType<typeof getTaxonWeights>>;

/** compendium principal component weights per taxon */
export const getTaxonWeights = async () => getTable<TaxonWeightsRow>(url);

expose({ getTaxonWeights });

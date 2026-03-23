import { expose } from "comlink";
import { request } from "@/util/async";
import taxonWeightsUrl from "./taxon-weights.json?url";

/** compendium principal component weights per taxon */
export type TaxonWeights = Record<
  string,
  {
    PC1: number;
    PC2: number;
    PC3: number;
    PC4: number;
    PC5: number;
    PC6: number;
    PC7: number;
    PC8: number;
  }
>;

/** get taxon weights */
export const getTaxonWeights = () => request<TaxonWeights>(taxonWeightsUrl);

expose({ getTaxonWeights });

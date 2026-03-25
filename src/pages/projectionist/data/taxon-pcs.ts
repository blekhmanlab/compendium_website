import { expose } from "comlink";
import { request } from "@/util/async";
import taxonPCsUrl from "./taxon-pcs.json?url";

/** compendium principal component pcs per ordination and per taxon */
export type TaxonPCs = Record<
  string,
  Record<
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
  >
>;

/** get taxon pcs */
export const getTaxonPCs = () => request<TaxonPCs>(taxonPCsUrl);

expose({ getTaxonPCs });

import type { PC } from "@/pages/projectionist/project";
import { expose } from "comlink";
import { request } from "@/util/async";
import taxonPCsUrl from "./taxon-pcs.json?url";

/** compendium principal component pcs per ordination and per taxon */
export type TaxonPCs = Record<string, Record<string, { [key: PC]: number }>>;

/** get taxon pcs */
export const getTaxonPCs = () => request<TaxonPCs>(taxonPCsUrl);

expose({ getTaxonPCs });

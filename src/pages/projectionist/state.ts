import type { Samples } from "@/pages/home/data/samples";
import type * as SamplePCsAPI from "@/pages/projectionist/data/sample-pcs";
import type { SamplePCs } from "@/pages/projectionist/data/sample-pcs";
import type { Scree } from "@/pages/projectionist/data/scree";
import type * as TaxonPCsAPI from "@/pages/projectionist/data/taxon-pcs";
import type { TaxonPCs } from "@/pages/projectionist/data/taxon-pcs";
import type {
  PC,
  UserMeta,
  UserProjected,
  UserReads,
  UserTaxa,
} from "@/pages/projectionist/project";
import type { Compendium } from "@/site";
import { wrap } from "comlink";
import { create } from "zustand";
import SamplePCsWorker from "@/pages/projectionist/data/sample-pcs?worker";
import { getScree } from "@/pages/projectionist/data/scree";
import TaxonPCsWorker from "@/pages/projectionist/data/taxon-pcs?worker";

export type Data = {
  userReads?: UserReads;
  userTaxa?: UserTaxa;
  userMeta?: UserMeta;
  userProjected?: UserProjected;
  samples?: Samples;
  samplePCs?: SamplePCs;
  taxonPCs?: TaxonPCs;
  scree?: Scree;
  PCX?: PC;
  PCY?: PC;
  ordination?: string;
};

/** projectionist page state store */
export const useData = create<Data>(() => ({}));

/** loaded sample pcs cache flag */
let loadedSamplePCs = "";

/** load and set sample pcs */
export const loadSamplePCs = async (
  compendium: Compendium,
  ordination: string,
) => {
  const key = `${compendium}:${ordination}`;
  if (key === loadedSamplePCs) return;
  const worker = wrap<typeof SamplePCsAPI>(new SamplePCsWorker());
  const samplePCs = await worker.getSamplePCs(compendium, ordination);
  useData.setState({ samplePCs });
  loadedSamplePCs = key;
};

/** loaded taxon pcs cache flag */
let loadedTaxonPCs = "";

/** load and set taxon pcs */
export const loadTaxonPCs = async (
  compendium: Compendium,
  ordination: string,
) => {
  const key = `${compendium}:${ordination}`;
  if (key === loadedTaxonPCs) return;
  const worker = wrap<typeof TaxonPCsAPI>(new TaxonPCsWorker());
  const taxonPCs = await worker.getTaxonPCs(compendium, ordination);
  useData.setState({ taxonPCs });
  loadedTaxonPCs = key;
};

/** loaded scree cache flag */
let loadedScree = "";

/** load and set scree data */
export const loadScree = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  if (compendium === loadedScree) return;
  const scree = await getScree(compendium);
  if (abort.signal.aborted) return;
  useData.setState({ scree });
  loadedScree = compendium;
};

/** set selected principal components */
export const setPCX = (PCX: PC) => useData.setState({ PCX });
export const setPCY = (PCY: PC) => useData.setState({ PCY });

/** set selected ordination */
export const setOrdination = (ordination: string) =>
  useData.setState({ ordination });

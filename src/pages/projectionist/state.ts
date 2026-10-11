import type * as SamplesAPI from "@/pages/home/data/samples";
import type { Compendium } from "@/pages/home/state";
import type * as SamplePCsAPI from "@/pages/projectionist/data/sample-pcs";
import type { Scree } from "@/pages/projectionist/data/scree";
import type * as TaxonPCsAPI from "@/pages/projectionist/data/taxon-pcs";
import type {
  PC,
  UserMeta,
  UserProjected,
  UserReads,
  UserTaxa,
} from "@/pages/projectionist/project";
import { wrap } from "comlink";
import { create } from "zustand";
import SamplesWorker from "@/pages/home/data/samples?worker";
import SamplePCsWorker from "@/pages/projectionist/data/sample-pcs?worker";
import { getScree } from "@/pages/projectionist/data/scree";
import TaxonPCsWorker from "@/pages/projectionist/data/taxon-pcs?worker";

export type Data = {
  userReads?: UserReads;
  userTaxa?: UserTaxa;
  userMeta?: UserMeta;
  userProjected?: UserProjected;
  samples?: SamplesAPI.Samples;
  samplePCs?: SamplePCsAPI.SamplePCs;
  taxonPCs?: TaxonPCsAPI.TaxonPCs;
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

/** loaded samples cache flag */
let loadedSamples = "";

/** load and set samples */
export const loadSamples = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  if (compendium === loadedSamples) return;
  const worker = wrap<typeof SamplesAPI>(new SamplesWorker());
  const samples = await worker.getSamples(compendium);
  if (abort.signal.aborted) return;
  useData.setState({ samples });
  loadedSamples = compendium;
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

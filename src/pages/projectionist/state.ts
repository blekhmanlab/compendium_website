import type * as SamplesAPI from "@/pages/home/data/samples";
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
import SamplesWorker from "@/pages/home/data/samples.ts?worker";
import SamplePCsWorker from "@/pages/projectionist/data/sample-pcs.ts?worker";
import { getScree } from "@/pages/projectionist/data/scree";
import TaxonPCsWorker from "@/pages/projectionist/data/taxon-pcs.ts?worker";

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

/** load and set sample pcs */
export const loadSamplePCs = async (ordination: string) => {
  const worker = wrap<typeof SamplePCsAPI>(new SamplePCsWorker());
  const samplePCs = await worker.getSamplePCs(ordination);
  useData.setState({ samplePCs });
};

/** load and set taxon pcs */
export const loadTaxonPCs = async (ordination: string) => {
  const worker = wrap<typeof TaxonPCsAPI>(new TaxonPCsWorker());
  const taxonPCs = await worker.getTaxonPCs(ordination);
  useData.setState({ taxonPCs });
};

/** load and set samples */
export const loadSamples = async () => {
  const worker = wrap<typeof SamplesAPI>(new SamplesWorker());
  const samples = await worker.getSamples();
  useData.setState({ samples });
};

/** load and set scree data */
export const loadScree = async () => useData.setState({ scree: getScree() });

/** set selected principal components */
export const setPCX = (PCX: PC) => useData.setState({ PCX });
export const setPCY = (PCY: PC) => useData.setState({ PCY });

/** set selected ordination */
export const setOrdination = (ordination: string) =>
  useData.setState({ ordination });

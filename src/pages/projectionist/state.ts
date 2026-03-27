import type * as SamplesAPI from "@/pages/home/data/samples";
import type * as CompendiumProjectedAPI from "@/pages/projectionist/data/sample-pcs";
import type { Scree } from "@/pages/projectionist/data/scree";
import type * as TaxaMapAPI from "@/pages/projectionist/data/taxa-map";
import type * as TaxonPCsAPI from "@/pages/projectionist/data/taxon-pcs";
import type {
  UserData,
  UserMeta,
  UserProjected,
} from "@/pages/projectionist/project";
import { wrap } from "comlink";
import { create } from "zustand";
import SamplesWorker from "@/pages/home/data/samples.ts?worker";
import SamplePCsWorker from "@/pages/projectionist/data/sample-pcs.ts?worker";
import { getScree } from "@/pages/projectionist/data/scree";
import TaxaMapWorker from "@/pages/projectionist/data/taxa-map.ts?worker";
import TaxonPCsWorker from "@/pages/projectionist/data/taxon-pcs.ts?worker";

export type Data = {
  samplePCs?: CompendiumProjectedAPI.SamplePCs;
  taxonPCs?: TaxonPCsAPI.TaxonPCs;
  taxaMap?: TaxaMapAPI.TaxaMap;
  userData?: UserData;
  userMeta?: UserMeta;
  userProjected?: UserProjected;
  samples?: SamplesAPI.Samples;
  scree?: Scree;
  selectedOrdination?: string;
};

export const useData = create<Data>(() => ({}));

/** load and set sample pcs */
export const loadSamplePCs = async () => {
  const worker = wrap<typeof CompendiumProjectedAPI>(new SamplePCsWorker());
  const samplePCs = await worker.getSamplePCs();
  useData.setState({ samplePCs });
};

/** load and set taxon pcs */
export const loadTaxonPCs = async () => {
  const worker = wrap<typeof TaxonPCsAPI>(new TaxonPCsWorker());
  const taxonPCs = await worker.getTaxonPCs();
  useData.setState({ taxonPCs });
};

/** load and set taxa map */
export const loadTaxaMap = async () => {
  const worker = wrap<typeof TaxaMapAPI>(new TaxaMapWorker());
  const taxaMap = await worker.getTaxaMap();
  useData.setState({ taxaMap });
};

/** load and set samples */
export const loadSamples = async () => {
  const worker = wrap<typeof SamplesAPI>(new SamplesWorker());
  const samples = await worker.getSamples();
  useData.setState({ samples });
};

/** load and set scree data */
export const loadScree = async () => useData.setState({ scree: getScree() });

/** set selected ordination */
export const setSelectedOrdination = (ordination: string) =>
  useData.setState({ selectedOrdination: ordination });

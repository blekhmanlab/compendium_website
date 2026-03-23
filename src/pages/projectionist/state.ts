import type * as SamplesAPI from "@/pages/home/data/samples";
import type * as CompendiumProjectedAPI from "@/pages/projectionist/data/sample-weights";
import type * as TaxaMapAPI from "@/pages/projectionist/data/taxa-map";
import type * as TaxonWeightsAPI from "@/pages/projectionist/data/taxon-weights";
import type {
  UserData,
  UserMeta,
  UserProjected,
} from "@/pages/projectionist/project";
import { wrap } from "comlink";
import { create } from "zustand";
import SamplesWorker from "@/pages/home/data/samples.ts?worker";
import SampleWeightsWorker from "@/pages/projectionist/data/sample-weights.ts?worker";
import TaxaMapWorker from "@/pages/projectionist/data/taxa-map.ts?worker";
import TaxonWeightsWorker from "@/pages/projectionist/data/taxon-weights.ts?worker";

export type Data = {
  sampleWeights?: CompendiumProjectedAPI.SampleWeights;
  taxonWeights?: TaxonWeightsAPI.TaxonWeights;
  taxaMap?: TaxaMapAPI.TaxaMap;
  userData?: UserData;
  userMeta?: UserMeta;
  userProjected?: UserProjected;
  samples?: SamplesAPI.Samples;
};

export const useData = create<Data>(() => ({}));

/** load and set sample weights */
export const loadSampleWeights = async () => {
  const worker = wrap<typeof CompendiumProjectedAPI>(new SampleWeightsWorker());
  const sampleWeights = await worker.getSampleWeights();
  useData.setState({ sampleWeights });
};

/** load and set taxon weights */
export const loadTaxonWeights = async () => {
  const worker = wrap<typeof TaxonWeightsAPI>(new TaxonWeightsWorker());
  const taxonWeights = await worker.getTaxonWeights();
  useData.setState({ taxonWeights });
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

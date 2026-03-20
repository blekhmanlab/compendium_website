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
};

export const useData = create<Data>(() => ({}));

/** load and set sample weight data */
export const loadSampleWeights = async () => {
  const worker = wrap<typeof CompendiumProjectedAPI>(new SampleWeightsWorker());
  const sampleWeights = await worker.getSampleWeights();
  useData.setState({ sampleWeights });
};

/** load and set taxon weight data */
export const loadTaxonWeights = async () => {
  const worker = wrap<typeof TaxonWeightsAPI>(new TaxonWeightsWorker());
  const taxonWeights = await worker.getTaxonWeights();
  useData.setState({ taxonWeights });
};

/** load and set taxa map data */
export const loadTaxaMap = async () => {
  const worker = wrap<typeof TaxaMapAPI>(new TaxaMapWorker());
  const taxaMap = await worker.getTaxaMap();
  useData.setState({ taxaMap });
};

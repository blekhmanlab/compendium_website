import { expose } from "comlink";
import { request } from "@/util/async";
import sampleWeightsUrl from "./sample-weights.json?url";

/** compendium principal component weights per loading and per sample */
export type SampleWeights = Record<
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

/** get sample weights */
export const getSampleWeights = () => request<SampleWeights>(sampleWeightsUrl);

expose({ getSampleWeights });

import { expose } from "comlink";
import { request } from "@/util/async";
import samplePCsUrl from "./sample-pcs.json?url";

/** compendium principal component pcs per ordination and per sample */
export type SamplePCs = Record<
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

/** get sample pcs */
export const getSamplePCs = () => request<SamplePCs>(samplePCsUrl);

expose({ getSamplePCs });

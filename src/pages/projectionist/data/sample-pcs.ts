import type { PC } from "@/pages/projectionist/project";
import { expose } from "comlink";
import { request } from "@/util/async";
import samplePCsUrl from "./sample-pcs.json?url";

/** compendium principal component pcs per ordination and per sample */
export type SamplePCs = Record<
  string,
  Record<string, { region: string; [key: PC]: number }>
>;

/** get sample pcs */
export const getSamplePCs = () => request<SamplePCs>(samplePCsUrl);

expose({ getSamplePCs });

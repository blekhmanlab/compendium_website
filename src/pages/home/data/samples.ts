import { expose } from "comlink";
import { request } from "@/util/async";
import samplesUrl from "./samples.json?url";

/** sample details */
export type Samples = {
  sample: string;
  project: string;
  run: string;
  reads: number;
  code: string;
  region: string;
}[];

/** get samples */
export const getSamples = () => request<Samples>(samplesUrl);

expose({ getSamples });

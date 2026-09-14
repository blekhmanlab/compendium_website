import type { Compendium } from "@/pages/home/state";
import { expose } from "comlink";
import { mapKeys } from "lodash";
import { request } from "@/util/async";

/** get all samples urls */
const samplesUrls = mapKeys(
  import.meta.glob<string>("./*/samples.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => path.match(/([^/]+)\/samples\.json$/)?.[1] ?? "",
);

/** sample details */
export type Samples = {
  sample: string;
  project: string;
  run: string;
  reads: number;
  code: string;
  region: string;
}[];

export const getSamples = (compendium: Compendium) =>
  request<Samples>(samplesUrls[compendium] ?? "");

expose({ getSamples });

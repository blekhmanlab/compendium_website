import type { PC } from "@/pages/projectionist/project";
import { expose } from "comlink";
import { mapKeys } from "lodash";
import { request } from "@/util/async";

/** get all sample PC urls */
const samplePCsUrls = mapKeys(
  import.meta.glob<{ default: string }>("./sample-pcs-*.json", {
    eager: true,
    query: "url",
  }),
  (_, path) => path.match(/sample-pcs-(.+)\.json/)?.[1] ?? "",
);

/** compendium principal component pcs per sample */
export type SamplePCs = Record<string, { region: string; [key: PC]: number }>;

/** get sample pcs */
export const getSamplePCs = (ordination: string) =>
  request<SamplePCs>(samplePCsUrls[ordination]?.default ?? "");

expose({ getSamplePCs });

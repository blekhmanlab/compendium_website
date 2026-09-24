import type { Compendium } from "@/pages/home/state";
import type { PC } from "@/pages/projectionist/project";
import { expose } from "comlink";
import { mapKeys } from "lodash";
import { request } from "@/util/async";

/** get all sample PC urls */
const samplePCsUrls = mapKeys(
  import.meta.glob<string>("./*/sample-pcs-*.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => {
    const [, compendium = "", ordination = ""] =
      path.match(/([^/]+)\/sample-pcs-(.+)\.json/) ?? [];
    return [compendium, ordination].join("|");
  },
);

/** compendium principal component pcs per sample */
export type SamplePCs = Record<string, { region: string } & Record<PC, number>>;

/** get sample pcs */
export const getSamplePCs = (compendium: Compendium, ordination: string) =>
  request<SamplePCs>(samplePCsUrls[[compendium, ordination].join("|")] ?? "");

expose({ getSamplePCs });

import type { PC } from "@/pages/projectionist/project";
import { expose } from "comlink";
import { mapKeys } from "lodash";
import { request } from "@/util/async";

/** get all taxon PC urls */
const taxonPCsUrls = mapKeys(
  import.meta.glob<{ default: string }>("./taxon-pcs-*.json", {
    eager: true,
    query: "url",
  }),
  (module) => module.default.match(/taxon-pcs-(.+)\.json/)?.[1] ?? "",
);

/** compendium principal component pcs per taxon */
export type TaxonPCs = Record<string, { [key: PC]: number }>;

/** get taxon pcs */
export const getTaxonPCs = (ordination: string) =>
  request<TaxonPCs>(taxonPCsUrls[ordination]?.default ?? "");

expose({ getTaxonPCs });

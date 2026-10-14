import type { Compendium } from "@/pages/home/state";
import type { PC } from "@/pages/projectionist/project";
import { expose } from "comlink";
import { mapKeys } from "lodash";
import { request } from "@/util/async";

/** get all taxon PC urls */
const taxonPCsUrls = mapKeys(
  import.meta.glob<string>("./*/taxon-pcs-*.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => {
    const [, compendium = "", ordination = ""] =
      path.match(/([^/]+)\/taxon-pcs-(.+)\.json/) ?? [];
    return [compendium, ordination].join("|");
  },
);

/** compendium principal component pcs per taxon */
export type TaxonPCs = Record<string, Record<PC, number>>;

/** get taxon pcs */
export const getTaxonPCs = (compendium: Compendium, ordination: string) =>
  request<TaxonPCs>(taxonPCsUrls[[compendium, ordination].join("|")] ?? "");

expose({ getTaxonPCs });

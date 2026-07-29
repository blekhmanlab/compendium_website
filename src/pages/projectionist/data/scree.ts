import { mapKeys } from "lodash";
import { request } from "@/util/async";

/** get all scree urls */
const screeUrls = mapKeys(
  import.meta.glob<string>("./human-microbiome-compendium/scree-*.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => path.match(/scree\.json/)?.[1] ?? "",
);

export type Scree = Record<
  string,
  { explained: Record<string, number>; cumulative: Record<string, number> }
>;

export const getScree = (compendium: string) => {
  console.log(compendium);
  return request<Scree>(screeUrls[compendium] ?? "");
};

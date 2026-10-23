import { mapKeys } from "lodash";
import { request } from "@/util/async";

/** get all scree urls */
const screeUrls = mapKeys(
  import.meta.glob<string>("./*/scree.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => path.match(/([^/]+)\/scree\.json/)?.[1] ?? "",
);

export type Scree = Record<
  string,
  { explained: Record<string, number>; cumulative: Record<string, number> }
>;

export const getScree = (compendium: string) =>
  request<Scree>(screeUrls[compendium] ?? "");

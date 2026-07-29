import type { Compendium } from "@/pages/home/state";
import type { Zenodo } from "../../../../compile/types/zenodo-api";
import { mapKeys } from "lodash";
import { site } from "@/site";
import { request } from "@/util/async";
import metaUrl from "./human-microbiome-compendium/meta.json?url";

/** get all meta urls */
const metaUrls = mapKeys(
  import.meta.glob<string>("./*/meta.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => path.match(/([^/]+)\/meta\.json$/)?.[1] ?? "",
);

/** metadata about overall project */
export type Meta = {
  projects: number;
  samples: number;
  phyla: number;
  classes: number;
  regions: number;
  countries: number;
  tags: number;
  version: string;
  date: string;
  downloads: number;
  views: number;
  size: number;
  uncompressed: number;
};

/** metadata (pre-computed) */
export const getMeta = async (compendium: Compendium) =>
  await request<Meta>(metaUrls[compendium] ?? metaUrl);

/** live metadata (from zenodo api) */
export const getLiveMeta = async (compendium: Compendium) => {
  const record = (await request<Zenodo>(site[compendium].record)).hits.hits[0];
  if (!record) {
    console.warn(`No hits for ${site[compendium].record}`);
    return {};
  }
  return {
    /** recalc any line from compile script that involves "record" */
    version: record.metadata.version,
    date: record.updated,
    downloads: record.stats.unique_downloads,
    views: record.stats.unique_views,
    size:
      record.files
        ?.map((file) => file.size)
        ?.reduce((total, value) => total + value, 0) || 0,
  };
};

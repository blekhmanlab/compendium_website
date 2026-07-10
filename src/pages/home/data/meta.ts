import type MetaType from "./meta.json";
import type { Zenodo } from "../../../../compile/types/zenodo-api";
import { site } from "@/site";
import { request } from "@/util/async";
import metaUrl from "./meta.json?url";

/** metadata about overall project */
export type Meta = typeof MetaType;

/** metadata (pre-computed) */
export const getMeta = async () => await request<Meta>(metaUrl);

/** live metadata (from zenodo api) */
export const getLiveMeta = async () => {
  const record = (await request<Zenodo>(site.humanMicrobiomeCompendium.record))
    .hits.hits[0];
  if (!record) throw Error("No hits");
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

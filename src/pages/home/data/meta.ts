import type MetaType from "./meta.json";
import type { Zenodo } from "../../../../compile/zenodo-api";
import { request } from "@/util/async";
import metaUrl from "./meta.json?url";

/** metadata about overall project */
export type Meta = typeof MetaType;

/** metadata (pre-computed) */
export const getMeta = async () => await request<Meta>(metaUrl);

/** record of downloads, version, and other info */
export const recordUrl =
  "https://zenodo.org/api/records?q=conceptrecid:8186993";

/** live metadata (from zenodo api) */
export const getLiveMeta = async () => {
  const record = (await request<Zenodo>(recordUrl)).hits.hits[0];
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

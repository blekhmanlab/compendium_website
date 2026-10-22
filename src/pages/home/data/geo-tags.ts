import type { Compendium } from "@/site";
import { expose } from "comlink";
import { mapKeys } from "lodash";
import { request } from "@/util/async";

/** get all region tag urls */
const regionTagsUrls = mapKeys(
  import.meta.glob<string>("./*/region-tags.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => path.match(/([^/]+)\/region-tags\.json$/)?.[1] ?? "",
);

/** get all country tag urls */
const countryTagsUrls = mapKeys(
  import.meta.glob<string>("./*/country-tags.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => path.match(/([^/]+)\/country-tags\.json$/)?.[1] ?? "",
);

export type RegionTags = Record<string, Record<string, number>>;

export type CountryTags = Record<string, Record<string, number>>;

/** get region and country tags */
export const getGeoTags = async (compendium: Compendium) => {
  const [regionTags, countryTags] = await Promise.all([
    request<RegionTags>(regionTagsUrls[compendium] ?? ""),
    request<CountryTags>(countryTagsUrls[compendium] ?? ""),
  ]);
  return { regionTags, countryTags };
};

expose({ getGeoTags });

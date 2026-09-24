import type { FeatureCollection, Geometry } from "geojson";
import type { Compendium } from "@/pages/home/state";
import { expose } from "comlink";
import { mapKeys } from "lodash";
import { request } from "@/util/async";
import { cleanSearch } from "./util";

/** get all regions urls */
const regionsUrls = mapKeys(
  import.meta.glob<string>("./*/regions.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => path.match(/([^/]+)\/regions\.json$/)?.[1] ?? "",
);

/** get all countries urls */
const countriesUrls = mapKeys(
  import.meta.glob<string>("./*/countries.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => path.match(/([^/]+)\/countries\.json$/)?.[1] ?? "",
);

type Properties = {
  region: string;
  country: string;
  code: string;
  samples: number;
};

/** regions combined with natural earth geojson feature data */
export type Regions = FeatureCollection<Geometry, Properties>;

/** countries combined with natural earth geojson feature data */
export type Countries = FeatureCollection<Geometry, Properties>;

export type GeoSearch = {
  name: string;
  type: "Region" | "Country";
  samples: number;
  fuzzy?: boolean;
}[];

/** get regions and countries */
export const getGeo = async (compendium: Compendium) => {
  const [regions, countries] = await Promise.all([
    request<Regions>(regionsUrls[compendium] ?? ""),
    request<Countries>(countriesUrls[compendium] ?? ""),
  ]);
  return { regions, countries };
};

/** derive search-friendly list (too big to load pre-compiled) */
export const getGeoSearch = async ({
  regions,
  countries,
}: {
  regions: Regions;
  countries: Countries;
}) => {
  const geoSearch: GeoSearch = [];

  /** include regions */
  for (const {
    properties: { region, samples },
  } of regions.features)
    geoSearch.push({ type: "Region", name: region, samples });

  /** include countries */
  for (const {
    properties: { country, samples },
  } of countries.features)
    geoSearch.push({ type: "Country", name: country, samples });

  return { geoSearch: cleanSearch(geoSearch) };
};

expose({ getGeo, getGeoSearch });

import type { FeatureCollection, Geometry } from "geojson";
import type ByCountryType from "./by-country.json";
import type ByRegionType from "./by-region.json";
import { expose } from "comlink";
import { request } from "@/util/async";
import byCountryUrl from "./by-country.json?url";
import byRegionUrl from "./by-region.json?url";
import { cleanSearch } from "./util";

/** by region, combined with natural earth geojson feature data */
export type ByRegion = FeatureCollection<
  Geometry,
  (typeof ByRegionType)["features"][number]["properties"]
>;

/** by country, combined with natural earth geojson feature data */
export type ByCountry = FeatureCollection<
  Geometry,
  (typeof ByCountryType)["features"][number]["properties"]
>;

export type GeoSearch = {
  name: string;
  type: "Region" | "Country";
  samples: number;
  fuzzy?: boolean;
}[];

/** by-region/by-country */
export const getGeoData = async () => {
  const [byRegion, byCountry] = await Promise.all([
    request<ByRegion>(byRegionUrl),
    request<ByCountry>(byCountryUrl),
  ]);
  return { byRegion, byCountry };
};

/** derive search-friendly list (too big to load pre-compiled) */
export const getGeoSearch = async ({
  byRegion,
  byCountry,
}: {
  byRegion: ByRegion;
  byCountry: ByCountry;
}) => {
  const geoSearch: GeoSearch = [];

  /** include regions */
  for (const {
    properties: { region, samples },
  } of byRegion.features)
    geoSearch.push({ type: "Region", name: region, samples });

  /** include countries */
  for (const {
    properties: { country, samples },
  } of byCountry.features)
    geoSearch.push({ type: "Country", name: country, samples });

  return { geoSearch: cleanSearch(geoSearch) };
};

expose({ getGeoData, getGeoSearch });

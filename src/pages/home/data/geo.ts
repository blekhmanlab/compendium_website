import type { FeatureCollection, Geometry } from "geojson";
import type CountriesType from "./countries.json";
import type RegionsType from "./regions.json";
import { expose } from "comlink";
import { request } from "@/util/async";
import countriesUrl from "./countries.json?url";
import regionsUrl from "./regions.json?url";
import { cleanSearch } from "./util";

/** by region, combined with natural earth geojson feature data */
export type Regions = FeatureCollection<
  Geometry,
  (typeof RegionsType)["features"][number]["properties"]
>;

/** by country, combined with natural earth geojson feature data */
export type Countries = FeatureCollection<
  Geometry,
  (typeof CountriesType)["features"][number]["properties"]
>;

export type GeoSearch = {
  name: string;
  type: "Region" | "Country";
  samples: number;
  fuzzy?: boolean;
}[];

/** regions/countries */
export const getGeoData = async () => {
  const [regions, countries] = await Promise.all([
    request<Regions>(regionsUrl),
    request<Countries>(countriesUrl),
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

expose({ getGeoData, getGeoSearch });

import type { FeatureCollection, Geometry } from "geojson";
import { expose } from "comlink";
import { request } from "@/util/async";
import countriesUrl from "./countries.json?url";
import regionsUrl from "./regions.json?url";
import { cleanSearch } from "./util";

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
export const getGeo = async () => {
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

expose({ getGeo, getGeoSearch });

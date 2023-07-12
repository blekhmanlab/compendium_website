import { FeatureCollection, Geometry } from "geojson";
import { create } from "zustand";

export type CSV = string[][];

export type TaxonomicPrevalence = {
  fullName: string;
  name: string;
  kingdom: string;
  phylum: string;
  _class: string;
  samples: number;
}[];

export type GeographicPrevalence = {
  code: string;
  name: string;
  samples: number;
  region: string;
}[];

export type MapPrevalence = FeatureCollection<
  Geometry,
  GeographicPrevalence[0]
>;

export type Data = {
  byClass?: TaxonomicPrevalence;
  byPhyla?: TaxonomicPrevalence;
  byCountry?: MapPrevalence;
  byRegion?: MapPrevalence;
};

export const useData = create<Data>(() => ({
  byClass: undefined,
  byPhyla: undefined,
  byCountry: undefined,
  byRegion: undefined,
}));

/** load data */
export const loadData = async () => {
  const [byClass, byPhyla, byCountry, byRegion] = await Promise.all([
    request<TaxonomicPrevalence>("by-class.json"),
    request<TaxonomicPrevalence>("by-phyla.json"),
    request<MapPrevalence>("by-country.json"),
    request<MapPrevalence>("by-region.json"),
  ]);

  useData.setState({ byClass, byPhyla, byCountry, byRegion });
};

/** fetch json */
const request = async <Type>(url: string): Promise<Type> => {
  const response = await fetch(url);
  if (!response.ok) throw Error("Response not OK");
  const data = await response.json();
  return data as Type;
};

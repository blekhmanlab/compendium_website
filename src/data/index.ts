import { FeatureCollection, Geometry } from "geojson";
import { create } from "zustand";

/** metadata about overall project */
export type Metadata = typeof import("../../public/metadata.json");

/** by class or phylum or other taxonomic level */
export type ByTaxLevel = typeof import("../../public/by-class.json");

/** by country or by region */
export type ByGeo =
  typeof import("../../public/by-country.json")["features"][number]["properties"][];

/** by country or by region, combined with natural earth geojson feature data */
export type ByMap = FeatureCollection<Geometry, ByGeo[number]>;

/** project and sample name details */
export type ByProject = typeof import("../../public/by-project.json");

export type Data = {
  metadata?: Metadata;
  byClass?: ByTaxLevel;
  byPhylum?: ByTaxLevel;
  byCountry?: ByMap;
  byRegion?: ByMap;
  byProject?: ByProject;
};

export const useData = create<Data>(() => ({}));

/** load data */
export const loadData = async () => {
  const [metadata, byClass, byPhylum, byCountry, byRegion, byProject] =
    await Promise.all([
      request<Metadata>("metadata.json"),
      request<ByTaxLevel>("by-class.json"),
      request<ByTaxLevel>("by-phylum.json"),
      request<ByMap>("by-country.json"),
      request<ByMap>("by-region.json"),
      request<ByProject>("by-project.json"),
    ]);

  useData.setState({
    metadata,
    byClass,
    byPhylum,
    byCountry,
    byRegion,
    byProject,
  });
};

/** fetch json */
const request = async <Type>(url: string): Promise<Type> => {
  const response = await fetch(url);
  if (!response.ok) throw Error("Response not OK");
  const data = await response.json();
  return data as Type;
};

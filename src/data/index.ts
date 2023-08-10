import { FeatureCollection, Geometry } from "geojson";
import { create } from "zustand";

/** metadata about overall project */
export type Metadata = typeof import("../../public/metadata.json");

/** project and sample name details */
export type ByProject = typeof import("../../public/by-project.json");

/** by class or phylum or other taxonomic level */
export type ByTaxLevel = typeof import("../../public/by-class.json");

/** by country or by region */
export type ByGeo =
  typeof import("../../public/by-country.json")["features"][number]["properties"][];

/** by country or by region, combined with natural earth geojson feature data */
export type ByMap = FeatureCollection<Geometry, ByGeo[number]>;

export type SearchList = {
  name: string;
  type: "Project" | "Sample" | "Phylum" | "Class" | "Region" | "Country";
  samples: number;
  fuzzy?: boolean;
}[];

export type Data = {
  metadata?: Metadata;
  byProject?: ByProject;
  byPhylum?: ByTaxLevel;
  byClass?: ByTaxLevel;
  byRegion?: ByMap;
  byCountry?: ByMap;
  searchList?: ReturnType<typeof compileSearchList>;
  selectedFeature?: { region: string; country: string; code: string };
};

export const useData = create<Data>(() => ({}));

/** one-time load app-wide data */
export const loadData = async () => {
  const [metadata, byProject, byPhylum, byClass, byRegion, byCountry] =
    await Promise.all([
      request<Metadata>("metadata.json"),
      request<ByProject>("by-project.json"),
      request<ByTaxLevel>("by-phylum.json"),
      request<ByTaxLevel>("by-class.json"),
      request<ByMap>("by-region.json"),
      request<ByMap>("by-country.json"),
    ]);

  const searchList = compileSearchList(
    byProject,
    byPhylum,
    byClass,
    byRegion,
    byCountry,
  );

  useData.setState({
    metadata,
    byProject,
    byPhylum,
    byClass,
    byRegion,
    byCountry,
    searchList,
  });
};

/** fetch json */
const request = async <Type>(url: string): Promise<Type> => {
  const response = await fetch(url);
  if (!response.ok) throw Error("Response not OK");
  const data = await response.json();
  return data as Type;
};

/**
 * collate all data into single list of entries to search. can't do this as
 * compile pre-process because file ends up being very large.
 */
const compileSearchList = (
  byProject: ByProject,
  byPhylum: ByTaxLevel,
  byClass: ByTaxLevel,
  byRegion: ByMap,
  byCountry: ByMap,
) => {
  /** collect complete list */
  let list: SearchList = [];

  /** include projects */
  for (const { project, samples } of byProject)
    list.push({
      type: "Project",
      name: project,
      samples: samples.length,
    });

  /** include samples */
  for (const { samples } of byProject)
    for (const sample of samples)
      list.push({ type: "Sample", name: sample, samples: 1 });

  /** include phyla */
  for (const { phylum, samples } of byPhylum)
    list.push({ type: "Phylum", name: phylum, samples });

  /** include classes */
  for (const { _class, samples } of byClass)
    list.push({ type: "Class", name: _class, samples });

  /** include regions */
  for (const {
    properties: { region, samples },
  } of byRegion.features)
    list.push({ type: "Region", name: region, samples });

  /** include countries */
  for (const {
    properties: { country, samples },
  } of byCountry.features)
    list.push({ type: "Country", name: country, samples });

  /** sort by number of samples */
  list.sort((a, b) => b.samples - a.samples);

  /** remove entries with no name (regions) */
  list = list.filter(({ name }) => name.trim());

  return list;
};

/** select country code */
export const setSelectedFeature = (feature?: {
  region: string;
  country: string;
  code: string;
}) => useData.setState({ selectedFeature: feature });

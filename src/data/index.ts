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

export type SearchList = {
  name: string;
  type: string;
  samples: number;
  fuzzy?: boolean;
}[];

export type Data = {
  metadata?: Metadata;
  byClass?: ByTaxLevel;
  byPhylum?: ByTaxLevel;
  byCountry?: ByMap;
  byRegion?: ByMap;
  byProject?: ByProject;
  searchList?: ReturnType<typeof compileSearchList>;
};

export const useData = create<Data>(() => ({}));

/** one-time load app-wide data */
export const loadData = async () => {
  const [metadata, byProject, byPhylum, byClass, byCountry, byRegion] =
    await Promise.all([
      request<Metadata>("metadata.json"),
      request<ByProject>("by-project.json"),
      request<ByTaxLevel>("by-phylum.json"),
      request<ByTaxLevel>("by-class.json"),
      request<ByMap>("by-country.json"),
      request<ByMap>("by-region.json"),
    ]);

  console.log(byRegion);

  const searchList = compileSearchList(
    byProject,
    byPhylum,
    byClass,
    byCountry,
    byRegion,
  );

  useData.setState({
    metadata,
    byProject,
    byPhylum,
    byClass,
    byCountry,
    byRegion,
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
  byClass: ByTaxLevel,
  byPhylum: ByTaxLevel,
  byCountry: ByMap,
  byRegion: ByMap,
) => {
  /** collect complete list */
  let list: SearchList = [];

  /** include classes */
  for (const { name, samples } of byClass)
    list.push({ type: "Class", name, samples });

  /** include phyla */
  for (const { name, samples } of byPhylum)
    list.push({ type: "Phylum", name, samples });

  /** include countries */
  for (const {
    properties: { name, samples },
  } of byCountry.features)
    list.push({ type: "Country", name, samples });

  /** include regions */
  for (const {
    properties: { region, samples },
  } of byRegion.features)
    list.push({ type: "Region", name: region, samples });

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

  /** sort by number of samples */
  list.sort((a, b) => b.samples - a.samples);

  /** remove entries with no name (regions) */
  list = list.filter(({ name }) => name.trim());

  return list;
};

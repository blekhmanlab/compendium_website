import { Zenodo } from "../../compile/zenodo-api";
import { FeatureCollection, Geometry } from "geojson";
import { orderBy } from "lodash";
import { create } from "zustand";

/** metadata about overall project */
export type Metadata = typeof import("../../public/metadata.json");

/** project and sample name details */
export type ByProject = typeof import("../../public/by-project.json");

/** by class or phylum or other taxonomic level */
export type ByTaxLevel = typeof import("../../public/by-class.json");

/** by country or by region, combined with natural earth geojson feature data */
export type ByGeo = FeatureCollection<
  Geometry,
  typeof import("../../public/by-country.json")["features"][number]["properties"]
>;

/** sample read counts */
export type ByReads = typeof import("../../public/by-reads.json");

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
  byRegion?: ByGeo;
  byCountry?: ByGeo;
  byReads?: ByReads;
  searchList?: ReturnType<typeof compileSearchList>;
  selectedFeature?: {
    region: string;
    country: string;
    code: string;
  };
};

export const useData = create<Data>(() => ({}));

/** record of downloads, version, and other info */
export const recordUrl =
  "https://zenodo.org/api/records?q=conceptrecid:8186993";

/** one-time load app-wide data */
export const loadData = async () => {
  const [metadata, byProject, byPhylum, byClass, byRegion, byCountry] =
    await Promise.all([
      load("metadata.json", "metadata"),
      load("by-project.json", "byProject"),
      load("by-phylum.json", "byPhylum"),
      load("by-class.json", "byClass"),
      load("by-region.json", "byRegion"),
      load("by-country.json", "byCountry"),
      load("by-reads.json", "byReads"),
    ]);

  const searchList = compileSearchList(
    byProject,
    byPhylum,
    byClass,
    byRegion,
    byCountry,
  );
  useData.setState({ searchList });

  /** update meta with live stats */
  const record = (await request<Zenodo>(recordUrl)).hits.hits[0];
  useData.setState(() => ({
    metadata: {
      ...metadata,
      /** recalc any line from compile script that involves record */
      version: record.metadata.version,
      date: record.updated,
      downloads: record.stats.unique_downloads,
      views: record.stats.unique_views,
      size:
        record.files
          ?.map((file) => file.size)
          ?.reduce((total, value) => total + value, 0) || 0,
    },
  }));
};

/** load json and set state */
const load = async <Key extends keyof Data>(
  url: string,
  key: Key,
): Promise<NonNullable<Data[Key]>> => {
  const data = await request<NonNullable<Data[Key]>>(url);
  useData.setState({ [key]: data });
  return data;
};

/** generic request wrapper */
const request = async <T>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw Error("Response not OK");
  const data = await response.json();
  return data as T;
};

/**
 * collate all data into single list of entries to search. can't do this as
 * compile pre-process because file ends up being very large.
 */
const compileSearchList = (
  byProject: ByProject,
  byPhylum: ByTaxLevel,
  byClass: ByTaxLevel,
  byRegion: ByGeo,
  byCountry: ByGeo,
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
    list.push({ type: "Phylum", name: phylum, samples: samples.total });

  /** include classes */
  for (const { _class, samples } of byClass)
    list.push({ type: "Class", name: _class, samples: samples.total });

  /** include regions */
  for (const {
    properties: { region, samples },
  } of byRegion.features)
    list.push({ type: "Region", name: region, samples: samples });

  /** include countries */
  for (const {
    properties: { country, samples },
  } of byCountry.features)
    list.push({ type: "Country", name: country, samples: samples });

  /** sort by number of samples or name */
  list = orderBy(list, ["samples", "name"], ["desc", "asc"]);

  /** remove entries with no name (regions) */
  list = list.filter(({ name }) => name.trim());

  return list;
};

/** select feature (country or region) */
export const setSelectedFeature = (feature?: {
  region: string;
  country: string;
  code: string;
}) =>
  useData.setState({
    selectedFeature:
      /** if feature already selected, deselect */
      useData.getState().selectedFeature === feature ? undefined : feature,
  });

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
  (typeof import("../../public/by-country.json"))["features"][number]["properties"]
>;

/** sample read counts */
export type ByReads = typeof import("../../public/by-reads.json");

/** tag project and sample counts */
export type ByTag = typeof import("../../public/by-tag.json");

/** tag value sample counts */
// export type ByTagValue = typeof import("../../public/by-tag-value.json");
export type ByTagValue = {
  tag: string;
  value: string;
  project: string;
  samples: number;
}[];

export type MetaSearchList = {
  name: string;
  type: "Project" | "Sample" | "Region" | "Country";
  samples: number;
  fuzzy?: boolean;
}[];

export type TaxaSearchList = {
  name: string;
  type: "Phylum" | "Class";
  samples: number;
  fuzzy?: boolean;
}[];

export type TagSearchList = {
  name: string;
  projects: number;
  samples: number;
  fuzzy?: boolean;
}[];

export type TagValueSearchList = {
  name: string;
  value: string;
  project: string;
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
  byTag?: ByTag;
  byTagValue?: ByTagValue;
  metaSearchList?: ReturnType<typeof compileMetaSearchList>;
  taxaSearchList?: ReturnType<typeof compileTaxaSearchList>;
  tagSearchList?: ReturnType<typeof compileTagSearchList>;
  tagValueSearchList?: ReturnType<typeof compileTagValueSearchList>;
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
  const [metadata, byProject, byPhylum, byClass, byRegion, byCountry, , byTag] =
    await Promise.all([
      load("metadata.json", "metadata"),
      load("by-project.json", "byProject"),
      load("by-phylum.json", "byPhylum"),
      load("by-class.json", "byClass"),
      load("by-region.json", "byRegion"),
      load("by-country.json", "byCountry"),
      load("by-reads.json", "byReads"),
      load("by-tag.json", "byTag"),
    ]);

  useData.setState({
    metaSearchList: compileMetaSearchList(byProject, byRegion, byCountry),
    taxaSearchList: compileTaxaSearchList(byPhylum, byClass),
    tagSearchList: compileTagSearchList(byTag),
  });

  /** update meta with live stats */
  const record = (await request<Zenodo>(recordUrl)).hits.hits[0];
  useData.setState(() => ({
    metadata: {
      ...metadata,
      /** recalc any line from compile script that involves "record" */
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

/** load tag value data (large) */
export const loadTagValueData = async () => {
  const tagValues = await load("by-tag-value.json", "byTagValue");
  useData.setState({
    tagValueSearchList: compileTagValueSearchList(tagValues),
  });
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
 * collate data into lists of entries to search. can't do this as compile
 * pre-process because file ends up being very large.
 */

const compileMetaSearchList = (
  byProject: ByProject,
  byRegion: ByGeo,
  byCountry: ByGeo,
) => {
  /** collect complete list */
  let list: MetaSearchList = [];

  /** include projects */
  for (const { project, samples } of byProject)
    list.push({ type: "Project", name: project, samples: samples.length });

  /** include samples */
  for (const { samples } of byProject)
    for (const sample of samples)
      list.push({ type: "Sample", name: sample, samples: 1 });

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

  /** sort by number of samples or name */
  list = orderBy(list, ["samples", "name"], ["desc", "asc"]);

  /** remove entries with no name (regions) */
  list = list.filter(({ name }) => name.trim());

  return list;
};

const compileTaxaSearchList = (byPhylum: ByTaxLevel, byClass: ByTaxLevel) => {
  /** collect complete list */
  let list: TaxaSearchList = [];

  /** include phyla */
  for (const { phylum, samples } of byPhylum)
    list.push({ type: "Phylum", name: phylum, samples: samples.total });

  /** include classes */
  for (const { _class, samples } of byClass)
    list.push({ type: "Class", name: _class, samples: samples.total });

  /** sort by number of samples or name */
  list = orderBy(list, ["samples", "name"], ["desc", "asc"]);

  /** remove entries with no name */
  list = list.filter(({ name }) => name.trim());

  return list;
};

const compileTagSearchList = (byTag: ByTag) => {
  /** collect complete list */
  let list: TagSearchList = [];

  /** include tags */
  for (const { tag, samples, projects } of byTag)
    list.push({ name: tag, samples, projects });

  /** sort by number of samples or name */
  list = orderBy(list, ["samples", "name"], ["desc", "asc"]);

  /** remove entries with no name (regions) */
  list = list.filter(({ name }) => name.trim());

  return list;
};

const compileTagValueSearchList = (byTagValue: ByTagValue) => {
  /** collect complete list */
  let list: TagValueSearchList = [];

  /** include tags */
  for (const { tag, value, samples, project } of byTagValue)
    list.push({ name: tag, value, project, samples });

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

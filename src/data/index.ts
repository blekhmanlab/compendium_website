import type { FeatureCollection, Geometry } from "geojson";
import { orderBy } from "lodash";
import { create } from "zustand";
import type { Zenodo } from "../../compile/zenodo-api";

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

export type ProjectSearch = {
  name: string;
  type: "Project" | "Sample";
  samples: number;
  fuzzy?: boolean;
}[];

export type GeoSearch = {
  name: string;
  type: "Region" | "Country";
  samples: number;
  fuzzy?: boolean;
}[];

export type TaxaSearch = {
  name: string;
  type: "Phylum" | "Class";
  samples: number;
  fuzzy?: boolean;
}[];

export type TagSearch = {
  name: string;
  projects: number;
  samples: number;
  fuzzy?: boolean;
}[];

export type TagValueSearch = {
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
  projectSearch?: ProjectSearch;
  geoSearch?: GeoSearch;
  taxaSearch?: TaxaSearch;
  tagSearch?: TagSearch;
  tagValueSearch?: TagValueSearch;
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

/** load app-wide meta-data */
export const loadMetaData = async () => {
  const metadata = await load("metadata.json", "metadata");

  /** update with live stats */
  const record = (await request<Zenodo>(recordUrl)).hits.hits[0];
  if (!record) throw Error("No hits");
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

/** load project/sample data */
export const loadProjectData = async () => {
  /** load static data */
  const byProject = await load("by-project.json", "byProject");

  /** derive search-friendly list (too big to pre-compile) */
  const list: ProjectSearch = [];

  /** include projects */
  for (const { project, samples } of byProject)
    list.push({ type: "Project", name: project, samples: samples.length });

  /** include samples */
  for (const { samples } of byProject)
    for (const sample of samples)
      list.push({ type: "Sample", name: sample, samples: 1 });

  useData.setState({ projectSearch: cleanSearch(list) });
};

/** load region/country data */
export const loadGeoData = async () => {
  /** load static data */
  const [byRegion, byCountry] = await Promise.all([
    load("by-region.json", "byRegion"),
    load("by-country.json", "byCountry"),
  ]);

  /** derive search-friendly list (too big to pre-compile) */
  const list: GeoSearch = [];

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

  useData.setState({ geoSearch: cleanSearch(list) });
};

/** load phylum/class data */
export const loadTaxaData = async () => {
  /** load static data */
  const [byPhylum, byClass] = await Promise.all([
    load("by-phylum.json", "byPhylum"),
    load("by-class.json", "byClass"),
  ]);

  /** derive search-friendly list (too big to pre-compile) */
  const list: TaxaSearch = [];

  /** include phyla */
  for (const { phylum, samples } of byPhylum)
    list.push({ type: "Phylum", name: phylum, samples: samples.total });

  /** include classes */
  for (const { _class, samples } of byClass)
    list.push({ type: "Class", name: _class, samples: samples.total });

  useData.setState({ taxaSearch: cleanSearch(list) });
};

/** load tag/value data */
export const loadTagData = async () => {
  /** load static data */
  const [byTag, byTagValue] = await Promise.all([
    load("by-tag.json", "byTag"),
    load("by-tag-value.json", "byTagValue"),
  ]);

  /** derive search-friendly list (too big to pre-compile) */
  const tagList: TagSearch = [];
  const tagValueList: TagValueSearch = [];

  /** tags */
  for (const { tag, samples, projects } of byTag)
    tagList.push({ name: tag, samples, projects });

  /** include tag values */
  for (const { tag, value, samples, project } of byTagValue)
    tagValueList.push({ name: tag, value, project, samples });

  useData.setState({
    tagSearch: cleanSearch(tagList),
    tagValueSearch: cleanSearch(tagValueList),
  });
};

/** filter/sort/etc search list */
const cleanSearch = <Entry extends { name: string; samples: number }>(
  list: Entry[],
) =>
  /** sort */
  orderBy(list, ["samples", "name"], ["desc", "asc"]).filter(({ name }) =>
    name.trim(),
  );

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
const request = async <Type>(url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw Error("Response not OK");
  return (await response.json()) as Type;
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

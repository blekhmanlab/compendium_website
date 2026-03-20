import type { ByCountry, ByRegion, GeoSearch } from "@/pages/home/data/geo.ts";
import type * as GeoAPI from "@/pages/home/data/geo.ts";
import type { Meta } from "@/pages/home/data/meta.ts";
import type * as ProjectAPI from "@/pages/home/data/project.ts";
import type {
  ByProject,
  ByReads,
  ProjectSearch,
} from "@/pages/home/data/project.ts";
import type * as TagAPI from "@/pages/home/data/tag.ts";
import type {
  ByTag,
  ByTagValue,
  TagSearch,
  TagValueSearch,
} from "@/pages/home/data/tag.ts";
import type * as TaxaAPI from "@/pages/home/data/taxa.ts";
import type { ByClass, ByPhylum, TaxaSearch } from "@/pages/home/data/taxa.ts";
import { wrap } from "comlink";
import { create } from "zustand";
import GeoWorker from "@/pages/home/data/geo.ts?worker";
import { getLiveMeta, getMeta } from "@/pages/home/data/meta.ts";
import ProjectWorker from "@/pages/home/data/project.ts?worker";
import TagWorker from "@/pages/home/data/tag.ts?worker";
import TaxaWorker from "@/pages/home/data/taxa.ts?worker";

export type Data = {
  meta?: Meta;
  byProject?: ByProject;
  byReads?: ByReads;
  projectSearch?: ProjectSearch;
  byRegion?: ByRegion;
  byCountry?: ByCountry;
  geoSearch?: GeoSearch;
  byPhylum?: ByPhylum;
  byClass?: ByClass;
  taxaSearch?: TaxaSearch;
  byTag?: ByTag;
  byTagValue?: ByTagValue;
  tagSearch?: TagSearch;
  tagValueSearch?: TagValueSearch;
  selectedFeature?: {
    region: string;
    country: string;
    code: string;
  };
};

/** home page data store */
export const useData = create<Data>(() => ({}));

/** load and set metadata */
export const loadMeta = async () => {
  let meta = await getMeta();
  useData.setState({ meta });
  meta = { ...meta, ...(await getLiveMeta()) };
  useData.setState({ meta });
};

/** load and set project data */
export const loadProject = async () => {
  const worker = wrap<typeof ProjectAPI>(new ProjectWorker());
  const { byProject, byReads } = await worker.getProject();
  useData.setState({ byProject, byReads });
  const { projectSearch } = await worker.getProjectSearch({ byProject });
  useData.setState({ projectSearch });
};

/** load and set geo data */
export const loadGeo = async () => {
  const worker = wrap<typeof GeoAPI>(new GeoWorker());
  const { byRegion, byCountry } = await worker.getGeoData();
  useData.setState({ byRegion, byCountry });
  const { geoSearch } = await worker.getGeoSearch({ byRegion, byCountry });
  useData.setState({ geoSearch });
};

/** load and set taxa data */
export const loadTaxa = async () => {
  const worker = wrap<typeof TaxaAPI>(new TaxaWorker());
  const { byPhylum, byClass } = await worker.getTaxa();
  useData.setState({ byPhylum, byClass });
  const { taxaSearch } = await worker.getTaxaSearch({ byPhylum, byClass });
  useData.setState({ taxaSearch });
};

/** load and set tag data */
export const loadTag = async () => {
  const worker = wrap<typeof TagAPI>(new TagWorker());
  const { byTag, byTagValue } = await worker.getTag();
  useData.setState({ byTag, byTagValue });
  const { tagSearch, tagValueSearch } = await worker.getTagSearch({
    byTag,
    byTagValue,
  });
  useData.setState({ tagSearch, tagValueSearch });
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

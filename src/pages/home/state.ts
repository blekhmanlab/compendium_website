import type { Countries, GeoSearch, Regions } from "@/pages/home/data/geo.ts";
import type * as GeoAPI from "@/pages/home/data/geo.ts";
import type { Meta } from "@/pages/home/data/meta.ts";
import type * as ProjectAPI from "@/pages/home/data/projects";
import type {
  Projects,
  ProjectSearch,
  Reads,
} from "@/pages/home/data/projects";
import type * as TagAPI from "@/pages/home/data/tag.ts";
import type {
  Tags,
  TagSearch,
  TagsValue,
  TagValueSearch,
} from "@/pages/home/data/tag.ts";
import type * as TaxaAPI from "@/pages/home/data/taxa.ts";
import type { Classes, Phyla, TaxonSearch } from "@/pages/home/data/taxa.ts";
import { wrap } from "comlink";
import { create } from "zustand";
import GeoWorker from "@/pages/home/data/geo.ts?worker";
import { getLiveMeta, getMeta } from "@/pages/home/data/meta.ts";
import ProjectWorker from "@/pages/home/data/projects.ts?worker";
import TagWorker from "@/pages/home/data/tag.ts?worker";
import TaxaWorker from "@/pages/home/data/taxa.ts?worker";

export type Data = {
  meta?: Meta;
  projects?: Projects;
  reads?: Reads;
  projectSearch?: ProjectSearch;
  regions?: Regions;
  countries?: Countries;
  geoSearch?: GeoSearch;
  phyla?: Phyla;
  classes?: Classes;
  taxonSearch?: TaxonSearch;
  tags?: Tags;
  tagsValue?: TagsValue;
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
export const loadProjects = async () => {
  const worker = wrap<typeof ProjectAPI>(new ProjectWorker());
  const { projects, reads } = await worker.getProjects();
  useData.setState({ projects, reads });
  const { projectSearch } = await worker.getProjectSearch({ projects });
  useData.setState({ projectSearch });
};

/** load and set geo data */
export const loadGeo = async () => {
  const worker = wrap<typeof GeoAPI>(new GeoWorker());
  const { regions, countries } = await worker.getGeoData();
  useData.setState({ regions, countries });
  const { geoSearch } = await worker.getGeoSearch({ regions, countries });
  useData.setState({ geoSearch });
};

/** load and set taxa data */
export const loadTaxa = async () => {
  const worker = wrap<typeof TaxaAPI>(new TaxaWorker());
  const { phyla, classes } = await worker.getTaxa();
  useData.setState({ phyla, classes });
  const { taxonSearch } = await worker.getTaxonSearch({ phyla, classes });
  useData.setState({ taxonSearch });
};

/** load and set tag data */
export const loadTags = async () => {
  const worker = wrap<typeof TagAPI>(new TagWorker());
  const { tags, tagsValue } = await worker.getTags();
  useData.setState({ tags, tagsValue });
  const { tagSearch, tagValueSearch } = await worker.getTagSearch({
    tags,
    tagsValue,
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

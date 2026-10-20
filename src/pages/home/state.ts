import type { Countries, GeoSearch, Regions } from "@/pages/home/data/geo";
import type * as GeoAPI from "@/pages/home/data/geo";
import type * as GeoTagAPI from "@/pages/home/data/geo-tags";
import type { CountryTags, RegionTags } from "@/pages/home/data/geo-tags";
import type { Meta } from "@/pages/home/data/meta";
import type * as ProjectAPI from "@/pages/home/data/projects";
import type {
  Projects,
  ProjectSearch,
  Reads,
} from "@/pages/home/data/projects";
import type * as SamplesAPI from "@/pages/home/data/samples";
import type { Samples } from "@/pages/home/data/samples";
import type * as TagAPI from "@/pages/home/data/tags";
import type {
  Tags,
  TagSearch,
  TagValues,
  TagValueSearch,
} from "@/pages/home/data/tags";
import type * as TaxaAPI from "@/pages/home/data/taxa";
import type { Classes, Phyla, TaxonSearch } from "@/pages/home/data/taxa";
import type meta from "@/site";
import { wrap } from "comlink";
import { create } from "zustand";
import GeoTagWorker from "@/pages/home/data/geo-tags?worker";
import GeoWorker from "@/pages/home/data/geo?worker";
import { getLiveMeta, getMeta } from "@/pages/home/data/meta";
import ProjectWorker from "@/pages/home/data/projects?worker";
import SamplesWorker from "@/pages/home/data/samples?worker";
import TagWorker from "@/pages/home/data/tags?worker";
import TaxaWorker from "@/pages/home/data/taxa?worker";
import site from "@/site";

export type Compendium = keyof typeof meta;

export type Data = {
  compendium: Compendium;
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
  samples?: Samples;
  tags?: Tags;
  tagValues?: TagValues;
  tagSearch?: TagSearch;
  tagValueSearch?: TagValueSearch;
  regionTags?: RegionTags;
  countryTags?: CountryTags;
  selectedFeature?: {
    region: string;
    country: string;
    countryCode: string;
  };
  selectedTags?: string[];
  selectedTagValues?: string[];
};

/** home page state store */
export const useData = create<Data>(() => ({
  compendium: "human-microbiome-compendium",
}));

/** set selected compendium */
export const setSelectedCompendium = (compendium: Compendium) =>
  useData.setState({ compendium });

/** get selected compendium */
export const getSelectedCompendium = () => useData.getState().compendium;

/** get selected compendium meta for site/page */
export const useSite = () => {
  const compendium = useData((state) => state.compendium);
  return site[compendium];
};

/** loaded meta cache flag */
let loadedMeta = "";

/** load and set metadata */
export const loadMeta = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  if (compendium === loadedMeta) return;
  let meta = await getMeta(compendium);
  if (abort.signal.aborted) return;
  useData.setState({ meta });
  meta = { ...meta, ...(await getLiveMeta(compendium)) };
  if (abort.signal.aborted) return;
  useData.setState({ meta });
  loadedMeta = compendium;
};

/** loaded projects cache flag */
let loadedProjects = "";

/** load and set projects */
export const loadProjects = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  if (compendium === loadedProjects) return;
  const worker = new ProjectWorker();
  const wrapper = wrap<typeof ProjectAPI>(worker);
  try {
    const { projects, reads } = await wrapper.getProjects(compendium);
    if (abort.signal.aborted) return;
    const { projectSearch } = await wrapper.getProjectSearch({ projects });
    if (abort.signal.aborted) return;
    useData.setState({ projects, reads, projectSearch });
    loadedProjects = compendium;
  } finally {
    worker.terminate();
  }
};

/** loaded geo cache flag */
let loadedGeo = "";

/** load and set geo data */
export const loadGeo = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  if (compendium === loadedGeo) return;
  const worker = new GeoWorker();
  const wrapper = wrap<typeof GeoAPI>(worker);
  try {
    const { regions, countries } = await wrapper.getGeo(compendium);
    if (abort.signal.aborted) return;
    const { geoSearch } = await wrapper.getGeoSearch({ regions, countries });
    if (abort.signal.aborted) return;
    useData.setState({ regions, countries, geoSearch });
    loadedGeo = compendium;
  } finally {
    worker.terminate();
  }
};

/** loaded taxa cache flag */
let loadedTaxa = "";

/** load and set taxa */
export const loadTaxa = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  if (compendium === loadedTaxa) return;
  const worker = new TaxaWorker();
  const wrapper = wrap<typeof TaxaAPI>(worker);
  try {
    const { phyla, classes } = await wrapper.getTaxa(compendium);
    if (abort.signal.aborted) return;
    const { taxonSearch } = await wrapper.getTaxonSearch({ phyla, classes });
    if (abort.signal.aborted) return;
    useData.setState({ phyla, classes, taxonSearch });
    loadedTaxa = compendium;
  } finally {
    worker.terminate();
  }
};

/** loaded samples cache flag */
let loadedSamples = "";

/** load and set samples */
export const loadSamples = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  if (compendium === loadedSamples) return;
  const worker = wrap<typeof SamplesAPI>(new SamplesWorker());
  const samples = await worker.getSamples(compendium);
  if (abort.signal.aborted) return;
  useData.setState({ samples });
  loadedSamples = compendium;
};

/** loaded tags cache flag */
let loadedTags = "";

/** load and set tags */
export const loadTags = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  if (compendium === loadedTags) return;
  const worker = new TagWorker();
  const wrapper = wrap<typeof TagAPI>(worker);
  try {
    const { tags, tagValues } = await wrapper.getTags(compendium);
    if (abort.signal.aborted) return;
    const { tagSearch, tagValueSearch } = await wrapper.getTagSearch({
      tags,
      tagValues,
    });
    if (abort.signal.aborted) return;
    useData.setState({ tags, tagValues, tagSearch, tagValueSearch });
    loadedTags = compendium;
  } finally {
    worker.terminate();
  }
};

/** loaded geo tags cache flag */
let loadedGeoTags = "";

/** load and set geo tags */
export const loadGeoTags = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  if (compendium === loadedGeoTags) return;
  const worker = new GeoTagWorker();
  const wrapper = wrap<typeof GeoTagAPI>(worker);
  try {
    const { regionTags, countryTags } = await wrapper.getGeoTags(compendium);
    if (abort.signal.aborted) return;
    useData.setState({ regionTags, countryTags });
    loadedGeoTags = compendium;
  } finally {
    worker.terminate();
  }
};

/** select feature (country or region) */
export const setSelectedFeature = (feature?: {
  region: string;
  country: string;
  countryCode: string;
}) =>
  useData.setState({
    selectedFeature:
      /** if feature already selected, deselect */
      useData.getState().selectedFeature === feature ? undefined : feature,
  });

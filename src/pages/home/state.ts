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
  TagValues,
  TagValueSearch,
} from "@/pages/home/data/tag.ts";
import type * as TaxaAPI from "@/pages/home/data/taxa.ts";
import type { Classes, Phyla, TaxonSearch } from "@/pages/home/data/taxa.ts";
import type meta from "@/site";
import { wrap } from "comlink";
import { create } from "zustand";
import GeoWorker from "@/pages/home/data/geo.ts?worker";
import { getLiveMeta, getMeta } from "@/pages/home/data/meta.ts";
import ProjectWorker from "@/pages/home/data/projects.ts?worker";
import TagWorker from "@/pages/home/data/tag.ts?worker";
import TaxaWorker from "@/pages/home/data/taxa.ts?worker";
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
  tags?: Tags;
  tagValues?: TagValues;
  tagSearch?: TagSearch;
  tagValueSearch?: TagValueSearch;
  selectedFeature?: {
    region: string;
    country: string;
    code: string;
  };
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

/** load and set metadata */
export const loadMeta = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  let meta = await getMeta(compendium);
  if (abort.signal.aborted) return;
  useData.setState({ meta });
  meta = { ...meta, ...(await getLiveMeta(compendium)) };
  if (abort.signal.aborted) return;
  useData.setState({ meta });
};

/** load and set projects */
export const loadProjects = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  const worker = new ProjectWorker();
  const wrapper = wrap<typeof ProjectAPI>(worker);
  try {
    const { projects, reads } = await wrapper.getProjects(compendium);
    if (abort.signal.aborted) return;
    useData.setState({ projects, reads });
    const { projectSearch } = await wrapper.getProjectSearch({ projects });
    if (abort.signal.aborted) return;
    useData.setState({ projectSearch });
  } finally {
    worker.terminate();
  }
};

/** load and set geo data */
export const loadGeo = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  const worker = new GeoWorker();
  const wrapper = wrap<typeof GeoAPI>(worker);
  try {
    const { regions, countries } = await wrapper.getGeo(compendium);
    if (abort.signal.aborted) return;
    useData.setState({ regions, countries });
    const { geoSearch } = await wrapper.getGeoSearch({ regions, countries });
    if (abort.signal.aborted) return;
    useData.setState({ geoSearch });
  } finally {
    worker.terminate();
  }
};

/** load and set taxa */
export const loadTaxa = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  const worker = new TaxaWorker();
  const wrapper = wrap<typeof TaxaAPI>(worker);
  try {
    const { phyla, classes } = await wrapper.getTaxa(compendium);
    if (abort.signal.aborted) return;
    useData.setState({ phyla, classes });
    const { taxonSearch } = await wrapper.getTaxonSearch({ phyla, classes });
    if (abort.signal.aborted) return;
    useData.setState({ taxonSearch });
  } finally {
    worker.terminate();
  }
};

/** load and set tags */
export const loadTags = async (
  compendium: Compendium,
  abort: AbortController,
) => {
  const worker = new TagWorker();
  const wrapper = wrap<typeof TagAPI>(worker);
  try {
    const { tags, tagValues } = await wrapper.getTags(compendium);
    if (abort.signal.aborted) return;
    useData.setState({ tags, tagValues });
    const { tagSearch, tagValueSearch } = await wrapper.getTagSearch({
      tags,
      tagValues,
    });
    if (abort.signal.aborted) return;
    useData.setState({ tagSearch, tagValueSearch });
  } finally {
    worker.terminate();
  }
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

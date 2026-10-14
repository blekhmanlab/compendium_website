import type { Compendium } from "@/pages/home/state";
import { expose } from "comlink";
import { mapKeys } from "lodash";
import { request } from "@/util/async";
import { cleanSearch } from "./util";

/** get all projects urls */
const projectsUrls = mapKeys(
  import.meta.glob<string>("./*/projects.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => path.match(/([^/]+)\/projects\.json$/)?.[1] ?? "",
);

/** get all reads urls */
const readsUrls = mapKeys(
  import.meta.glob<string>("./*/reads.json", {
    eager: true,
    query: "url",
    import: "default",
  }),
  (_, path) => path.match(/([^/]+)\/reads\.json$/)?.[1] ?? "",
);

/** project and sample names */
export type Projects = {
  project: string;
  samples: string[];
}[];

/** sample read counts */
export type Reads = {
  histogram: {
    samples: {
      total: number;
      [key: string]: number;
    };
    min: number;
    max: number;
    mid: number;
  }[];
  median: {
    total: number;
    [key: string]: number;
  };
};

export type ProjectSearch = {
  name: string;
  type: "Project" | "Sample";
  samples: number;
  fuzzy?: boolean;
}[];

/** get projects and reads */
export const getProjects = async (compendium: Compendium) => {
  /** load static data */
  const [projects, reads] = await Promise.all([
    request<Projects>(projectsUrls[compendium] ?? ""),
    request<Reads>(readsUrls[compendium] ?? ""),
  ]);
  return { projects, reads };
};

/** derive search-friendly list (too big to load pre-compiled) */
export const getProjectSearch = async ({
  projects,
}: {
  projects: Projects;
}) => {
  const projectSearch: ProjectSearch = [];

  /** include projects */
  for (const { project, samples } of projects)
    projectSearch.push({
      type: "Project",
      name: project,
      samples: samples.length,
    });

  /** include samples */
  for (const { samples } of projects)
    for (const sample of samples)
      projectSearch.push({
        type: "Sample",
        name: sample,
        samples: 1,
      });

  return { projectSearch: cleanSearch(projectSearch) };
};

expose({ getProjects, getProjectSearch });

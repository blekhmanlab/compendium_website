import type ReadsType from "./reads.json";
import type ProjectsType from "./projects.json";
import { expose } from "comlink";
import { request } from "@/util/async";
import readsUrl from "./reads.json?url";
import projectsUrl from "./projects.json?url";
import { cleanSearch } from "./util";

/** project and sample name details */
export type Projects = typeof ProjectsType;

/** sample read counts */
export type Reads = typeof ReadsType;

export type ProjectSearch = {
  name: string;
  type: "Project" | "Sample";
  samples: number;
  fuzzy?: boolean;
}[];

/** projects */
export const getProjects = async () => {
  /** load static data */
  const [projects, reads] = await Promise.all([
    request<Projects>(projectsUrl),
    request<Reads>(readsUrl),
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

import type ByProjectType from "./by-project.json";
import type ByReadsType from "./by-reads.json";
import { expose } from "comlink";
import { request } from "@/util/async";
import byProjectUrl from "./by-project.json?url";
import byReadsUrl from "./by-reads.json?url";
import { cleanSearch } from "./util";

/** project and sample name details */
export type ByProject = typeof ByProjectType;

/** sample read counts */
export type ByReads = typeof ByReadsType;

export type ProjectSearch = {
  name: string;
  type: "Project" | "Sample";
  samples: number;
  fuzzy?: boolean;
}[];

/** by-project/by-reads */
export const getProject = async () => {
  /** load static data */
  const [byProject, byReads] = await Promise.all([
    request<ByProject>(byProjectUrl),
    request<ByReads>(byReadsUrl),
  ]);
  return { byProject, byReads };
};

/** derive search-friendly list (too big to load pre-compiled) */
export const getProjectSearch = async ({
  byProject,
}: {
  byProject: ByProject;
}) => {
  const projectSearch: ProjectSearch = [];

  /** include projects */
  for (const { project, samples } of byProject)
    projectSearch.push({
      type: "Project",
      name: project,
      samples: samples.length,
    });

  /** include samples */
  for (const { samples } of byProject)
    for (const sample of samples)
      projectSearch.push({
        type: "Sample",
        name: sample,
        samples: 1,
      });

  return { projectSearch: cleanSearch(projectSearch) };
};

expose({ getProject, getProjectSearch });

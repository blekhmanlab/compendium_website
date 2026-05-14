import { expose } from "comlink";
import { cleanSearch } from "@/pages/home/data/util";
import { request } from "@/util/async";
import tagValuesUrl from "./tag-values.json?url";
import tagsUrl from "./tags.json?url";

/** tag project and sample counts */
export type Tags = {
  tag: string;
  projects: number;
  samples: number;
}[];

/** tag value sample counts */
export type TagValues = {
  tag: string;
  value: string;
  project: string;
  samples: number;
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

/** get tags and tag-values */
export const getTags = async () => {
  const [tags, tagValues] = await Promise.all([
    request<Tags>(tagsUrl),
    request<TagValues>(tagValuesUrl),
  ]);
  return { tags, tagValues };
};

/** derive search-friendly list (too big to load pre-compiled) */
export const getTagSearch = ({
  tags,
  tagValues,
}: {
  tags: Tags;
  tagValues: TagValues;
}) => {
  const tagList: TagSearch = [];
  const tagValueList: TagValueSearch = [];

  /** tags */
  for (const { tag, samples, projects } of tags)
    tagList.push({ name: tag, samples, projects });

  /** include tag values */
  for (const { tag, value, samples, project } of tagValues)
    tagValueList.push({ name: tag, value, project, samples });

  return {
    tagSearch: cleanSearch(tagList),
    tagValueSearch: cleanSearch(tagValueList),
  };
};

expose({ getTags, getTagSearch });

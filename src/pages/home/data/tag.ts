import type TagsType from "./tags.json";
import { expose } from "comlink";
import { cleanSearch } from "@/pages/home/data/util";
import { request } from "@/util/async";
import tagsValueUrl from "./tag-values.json?url";
import tagsUrl from "./tags.json?url";

/** tag project and sample counts */
export type Tags = typeof TagsType;

// export type TagsValue = typeof TagsValueType;
// json file too big for typescript to infer type structure

/** tag value sample counts */
export type TagsValue = {
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

/** tags/tag-values */
export const getTags = async () => {
  const [tags, tagsValue] = await Promise.all([
    request<Tags>(tagsUrl),
    request<TagsValue>(tagsValueUrl),
  ]);
  return { tags, tagsValue };
};

/** derive search-friendly list (too big to load pre-compiled) */
export const getTagSearch = ({
  tags,
  tagsValue,
}: {
  tags: Tags;
  tagsValue: TagsValue;
}) => {
  const tagList: TagSearch = [];
  const tagValueList: TagValueSearch = [];

  /** tags */
  for (const { tag, samples, projects } of tags)
    tagList.push({ name: tag, samples, projects });

  /** include tag values */
  for (const { tag, value, samples, project } of tagsValue)
    tagValueList.push({ name: tag, value, project, samples });

  return {
    tagSearch: cleanSearch(tagList),
    tagValueSearch: cleanSearch(tagValueList),
  };
};

expose({ getTags, getTagSearch });

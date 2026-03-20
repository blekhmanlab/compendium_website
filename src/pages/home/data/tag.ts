import type ByTagType from "./by-tag.json";
import { expose } from "comlink";
import { cleanSearch } from "@/pages/home/data/util";
import { request } from "@/util/async";
import byTagValueUrl from "./by-tag-value.json?url";
import byTagUrl from "./by-tag.json?url";

/** tag project and sample counts */
export type ByTag = typeof ByTagType;

// export type ByTagValue = typeof ByTagValueType;
// json file too big for typescript to infer type structure

/** tag value sample counts */
export type ByTagValue = {
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

/** by-tag/by-tag-value */
export const getTag = async () => {
  const [byTag, byTagValue] = await Promise.all([
    request<ByTag>(byTagUrl),
    request<ByTagValue>(byTagValueUrl),
  ]);
  return { byTag, byTagValue };
};

/** derive search-friendly list (too big to load pre-compiled) */
export const getTagSearch = ({
  byTag,
  byTagValue,
}: {
  byTag: ByTag;
  byTagValue: ByTagValue;
}) => {
  const tagList: TagSearch = [];
  const tagValueList: TagValueSearch = [];

  /** tags */
  for (const { tag, samples, projects } of byTag)
    tagList.push({ name: tag, samples, projects });

  /** include tag values */
  for (const { tag, value, samples, project } of byTagValue)
    tagValueList.push({ name: tag, value, project, samples });

  return {
    tagSearch: cleanSearch(tagList),
    tagValueSearch: cleanSearch(tagValueList),
  };
};

expose({ getTag, getTagSearch });

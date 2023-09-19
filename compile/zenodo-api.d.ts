/** https://jvilk.com/MakeTypes/ */

export interface Zenodo {
  conceptdoi: string;
  conceptrecid: string;
  created: string;
  doi: string;
  files?: FilesEntity[] | null;
  id: number;
  links: Links;
  metadata: Metadata;
  owners?: number[] | null;
  revision: number;
  stats: Stats;
  updated: string;
}
export interface FilesEntity {
  bucket: string;
  checksum: string;
  key: string;
  links: Links1;
  size: number;
  type: string;
}
export interface Links1 {
  self: string;
}
export interface Links {
  badge: string;
  bucket: string;
  conceptbadge: string;
  conceptdoi: string;
  doi: string;
  html: string;
  latest: string;
  latest_html: string;
  self: string;
}
export interface Metadata {
  access_right: string;
  access_right_category: string;
  creators?: CreatorsEntity[] | null;
  description: string;
  doi: string;
  language: string;
  license: License;
  publication_date: string;
  related_identifiers?: RelatedIdentifiersEntity[] | null;
  relations: Relations;
  resource_type: ResourceType;
  title: string;
  version: string;
}
export interface CreatorsEntity {
  affiliation: string;
  name: string;
  orcid: string;
}
export interface License {
  id: string;
}
export interface RelatedIdentifiersEntity {
  identifier: string;
  relation: string;
  scheme: string;
}
export interface Relations {
  version?: VersionEntity[] | null;
}
export interface VersionEntity {
  count: number;
  index: number;
  is_last: boolean;
  last_child: LastChildOrParent;
  parent: LastChildOrParent;
}
export interface LastChildOrParent {
  pid_type: string;
  pid_value: string;
}
export interface ResourceType {
  title: string;
  type: string;
}
export interface Stats {
  downloads: number;
  unique_downloads: number;
  unique_views: number;
  version_downloads: number;
  version_unique_downloads: number;
  version_unique_views: number;
  version_views: number;
  version_volume: number;
  views: number;
  volume: number;
}

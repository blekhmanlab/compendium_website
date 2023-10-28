/** https://jvilk.com/MakeTypes/ */
export interface Zenodo {
  hits: Hits;
  aggregations: Aggregations;
}
export interface Hits {
  hits: Record[];
  total: number;
}
export interface Record {
  created: string;
  modified: string;
  id: number;
  conceptrecid: string;
  doi: string;
  conceptdoi: string;
  doi_url: string;
  metadata: Metadata;
  title: string;
  links: Links;
  updated: string;
  recid: string;
  revision: number;
  files?: File[];
  owners?: Owner[];
  status: string;
  stats: Stats;
  state: string;
  submitted: boolean;
}
export interface Metadata {
  title: string;
  doi: string;
  publication_date: string;
  description: string;
  access_right: string;
  creators?: Creator[];
  keywords?: string[];
  related_identifiers?: RelatedIdentifier[];
  version: string;
  language: string;
  resource_type: ResourceType;
  license: License;
  relations: Relations;
}
export interface Creator {
  name: string;
  affiliation: string;
  orcid: string;
}
export interface RelatedIdentifier {
  identifier: string;
  relation: string;
  resource_type: string;
  scheme: string;
}
export interface ResourceType {
  title: string;
  type: string;
}
export interface License {
  id: string;
}
export interface Relations {
  version?: Version[];
}
export interface Version {
  index: number;
  is_last: boolean;
  parent: Parent;
}
export interface Parent {
  pid_type: string;
  pid_value: string;
}
export interface Links {
  self: string;
  self_html: string;
  self_doi: string;
  doi: string;
  parent: string;
  parent_html: string;
  parent_doi: string;
  self_iiif_manifest: string;
  self_iiif_sequence: string;
  files: string;
  media_files: string;
  archive: string;
  archive_media: string;
  latest: string;
  latest_html: string;
  draft: string;
  versions: string;
  access_links: string;
  access_users: string;
  access_request: string;
  access: string;
  reserve_doi: string;
  communities: string;
  "communities-suggestions": string;
  requests: string;
}
export interface File {
  id: string;
  key: string;
  size: number;
  checksum: string;
  links: Links1;
}
export interface Links1 {
  self: string;
}
export interface Owner {
  id: number;
}
export interface Stats {
  downloads: number;
  unique_downloads: number;
  views: number;
  unique_views: number;
  version_downloads: number;
  version_unique_downloads: number;
  version_unique_views: number;
  version_views: number;
}
export interface Aggregations {
  access_status: AccessStatusOrSubjectOrFileType;
  resource_type: ResourceType1;
  subject: AccessStatusOrSubjectOrFileType;
  file_type: AccessStatusOrSubjectOrFileType;
}
export interface AccessStatusOrSubjectOrFileType {
  buckets?: Bucket[];
  label: string;
}
export interface Bucket {
  key: string;
  doc_count: number;
  label: string;
  is_selected: boolean;
}
export interface ResourceType1 {
  buckets?: Bucket1[];
  label: string;
}
export interface Bucket1 {
  key: string;
  doc_count: number;
  label: string;
  is_selected: boolean;
  inner: Inner;
}
export interface Inner {
  buckets?: null[];
}

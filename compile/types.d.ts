import type { FeatureCollection, Geometry } from "geojson";

/**
 * keep these types separate from those in state data. state data types are
 * inferred directly from the JSON files, so they exactly match what will be
 * accessed by the built app. the types here should be spelled out explicitly to
 * define what the script's functions should spit out, and because during
 * dev/testing/changes, the JSON files may be missing/incorrect.
 */

type Metadata = {
  projects: number;
  samples: number;
  phyla: number;
  classes: number;
  countries: number;
  regions: number;
  tags: number;
  version: string;
  date: string;
  downloads: number;
  views: number;
  size: number;
  uncompressed: number;
};

type ByTaxLevel = {
  kingdom: string;
  phylum: string;
  _class: string;
  samples: Record<string, number>;
}[];

type WorldMap = FeatureCollection<Geometry, Record<string, string | number>>;

type ByGeo = FeatureCollection<
  Geometry,
  {
    region: string;
    country: string;
    code: string;
    samples: number;
  }
>;

type ByProject = {
  project: string;
  samples: string[];
}[];

type ByTag = {
  tag: string;
  projects: number;
  samples: number;
}[];

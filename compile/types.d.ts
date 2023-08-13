import { FeatureCollection, Geometry } from "geojson";

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
  date: string;
  url: string;
  version: string;
};

type ByTaxLevel = {
  kingdom: string;
  phylum: string;
  _class: string;
  samples: { [key: string]: number };
}[];

type Countries = {
  [key: string]: {
    region: string;
    country: string;
    code: string;
    samples: number;
  };
};

type Features = FeatureCollection<Geometry, { [key: string]: string | number }>;

type ByMap = FeatureCollection<Geometry, ByGeo[number]>;

type ByProject = {
  project: string;
  samples: string[];
}[];

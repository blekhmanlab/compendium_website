import { proxy, Remote, wrap } from "comlink";
import { FeatureCollection } from "geojson";
import { create } from "zustand";
import DataWorker from "./worker?worker";

export type CSV = string[][];

export type TaxonomicPrevalence = {
  fullName: string;
  name: string;
  kingdom: string;
  phylum: string;
  _class: string;
  samples: number;
}[];

export type GeographicPrevalence = {
  code: string;
  name: string;
  samples: number;
  region: string;
}[];

type Status = string;

export type Data = {
  /** class data */
  classes: TaxonomicPrevalence | Status;
  /** phylum data */
  phyla: TaxonomicPrevalence | Status;
  /** region data */
  regions: CSV | Status;
  /** countries data */
  countries: GeographicPrevalence | Status;
  /** world map data */
  world: FeatureCollection | Status;
};

export const useData = create<Data>(() => ({
  classes: "no data",
  phyla: "no data",
  regions: "no data",
  countries: "no data",
  world: "no data",
}));

/** load data */
export const loadData = async () => {
  /** get exports from worker to define types for methods/objects/etc. */
  type API = typeof import("./worker.ts");

  /** wrapper func for creating worker */
  const thread = <Key extends keyof Data>(
    method: (worker: Remote<API>) => Promise<Data[Key]>,
    key: Key
  ): Promise<void> =>
    new Promise((resolve) => {
      let resolved = false;
      /** create worker instance */
      const worker = wrap<API>(new DataWorker());
      /** on progress update */
      worker.onProgress(
        proxy((status) => {
          /** make sure on progress message hasn't arrived after final result */
          if (!resolved)
            /** set state to status */
            useData.setState({ [key]: status });
        })
      );
      /** execute specified method, and set state on final result */
      method(worker)
        .then((result) => useData.setState({ [key]: result }))
        .catch((error: Error) => {
          console.error(error);
          useData.setState({ [key]: "Error" });
        })
        .finally(() => {
          resolved = true;
          resolve();
        });
    });

  /** load and parse data files in parallel web workers */
  thread((worker) => worker.getTaxonomic("classes.csv"), "classes");
  thread((worker) => worker.getTaxonomic("phyla.csv"), "phyla");
  thread((worker) => worker.getGeographic(), "countries");
  thread((worker) => worker.getWorld(), "world");
};

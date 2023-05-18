import DataWorker from "./worker?worker";
import { proxy, Remote, wrap } from "comlink";
import { FeatureCollection } from "geojson";
import { create } from "zustand";

export type CSV = string[][];

export type TaxonomicPrevalence = {
  fullName: string;
  name: string;
  kingdom: string;
  phylum: string;
  _class: string;
  samples: number;
}[];

export type CountryPrevalence = {
  code: string;
  name: string;
  samples: number;
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
  countries: CountryPrevalence | Status;
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
  const makeWorker = <Key extends keyof Data>(
    method: (worker: Remote<API>) => Promise<Data[Key]>,
    key: Key
  ) => {
    /** create worker instance */
    const worker = wrap<API>(new DataWorker());
    /** execute specified method, and set state on final result */
    method(worker)
      .then((result) => useData.setState({ [key]: result }))
      .catch((error: Error) => {
        console.error(error);
        useData.setState({ [key]: "Error" });
      });
    /** on progress update, set state to status */
    worker.onProgress(proxy((status) => useData.setState({ [key]: status })));
  };

  /** load and parse data files in parallel web workers */
  makeWorker((worker) => worker.getTable("classes.csv"), "classes");
  makeWorker((worker) => worker.getTable("phyla.csv"), "phyla");
  makeWorker((worker) => worker.parseCsv("regions.csv"), "regions");
  makeWorker((worker) => worker.getCountries("countries.csv"), "countries");
  makeWorker((worker) => worker.getWorld(), "world");
};

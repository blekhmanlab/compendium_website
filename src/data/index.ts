import { proxy, Remote, wrap } from "comlink";
import { create } from "zustand";
import DataWorker from "./worker?worker";

export type CSV = unknown[][];

export type Table = {
  fullName: string;
  name: string;
  kingdom: string;
  phylum: string;
  _class: string;
  samples: number;
}[];

type Status = string;

export type Data = {
  /** class data */
  classes: Table | Status;
  /** phylum data */
  phyla: Table | Status;
  /** region data */
  regions: CSV | Status;
  /** countries data */
  countries: CSV | Status;
};

export const useData = create<Data>(() => ({
  classes: "no data",
  phyla: "no data",
  regions: "no data",
  countries: "no data",
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
    method(worker).then((result) => useData.setState({ [key]: result }));
    /** on progress update, set state to status */
    worker.onProgress(proxy((status) => useData.setState({ [key]: status })));
  };

  /** load and parse data files in parallel web workers */
  makeWorker((worker) => worker.parseTable("classes.csv"), "classes");
  makeWorker((worker) => worker.parseTable("phyla.csv"), "phyla");
  makeWorker((worker) => worker.parseData("regions.csv"), "regions");
  makeWorker((worker) => worker.parseData("countries.csv"), "countries");
};

import { create } from "zustand";

export type CSV = (string | number)[][];

export type Table = {
  fullName: string;
  name: string;
  kingdom: string;
  phylum: string;
  _class: string;
  samples: number;
}[];

type Data = {
  /** class data */
  classes?: Table;
  /** phylum data */
  phyla?: Table;
  /** region data */
  regions?: CSV;
  /** countries data */
  countries?: CSV;
};

export const useData = create<Data>(() => ({
  classes: undefined,
  phyla: undefined,
  regions: undefined,
  countries: undefined,
}));

/** load data */
export const loadData = async () => {
  /** create web worker */
  const worker = () =>
    new ComlinkWorker<typeof import("./worker.ts")>(
      new URL("./worker.ts", import.meta.url)
    );

  /** load and parse data files in parallel web workers */
  worker()
    .parseTable("classes.csv.gz")
    .then((classes) => useData.setState({ classes }));
  worker()
    .parseTable("phyla.csv.gz")
    .then((phyla) => useData.setState({ phyla }));
  worker()
    .parseData("regions.csv.gz")
    .then((regions) => useData.setState({ regions }));
  worker()
    .parseData("countries.csv.gz")
    .then((countries) => useData.setState({ countries }));
};

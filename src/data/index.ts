import { create } from "zustand";

// type Header = [unknown, ...string[]];
// type Row = [string, ...(number | string)[]];
// export type CSV = [Header, ...Row[]];
export type CSV = (string | number)[][];

type Data = {
  /** class data */
  classes?: CSV;
  /** phylum data */
  phyla?: CSV;
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
  /** import functions as web workers */
  const dataWorker = new ComlinkWorker<typeof import("./worker.ts")>(
    new URL("./worker.ts", import.meta.url)
  );

  /** load and parse data files in parallel web workers */
  const [classes, phyla, regions, countries] = (
    await Promise.allSettled(
      [
        { file: "classes.csv.gz", computeTotals: true },
        { file: "phyla.csv.gz", computeTotals: true },
        { file: "regions.csv.gz", computeTotals: false },
        { file: "countries.csv.gz", computeTotals: false },
      ].map(
        async ({ file, computeTotals }) =>
          await dataWorker.parseData(file, computeTotals)
      )
    )
  ).map((result) => (result.status === "fulfilled" ? result.value : undefined));

  useData.setState({ classes, phyla, regions, countries });
};

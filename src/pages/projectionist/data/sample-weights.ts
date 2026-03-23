import { expose } from "comlink";
import { getTable } from "@/pages/projectionist/data/util";
import asiaUrl from "./sample-weights-asia.tsv?url";
import europeUrl from "./sample-weights-europe.tsv?url";
import fullUrl from "./sample-weights-full.tsv?url";
import noneuropeUrl from "./sample-weights-noneurope.tsv?url";

type SampleWeightsRow = {
  /** sample details */
  sample: string;
  project: string;
  /** principal components */
  PC1: number;
  PC2: number;
  PC3: number;
  PC4: number;
  PC5: number;
  PC6: number;
  PC7: number;
  PC8: number;
};

export type SampleWeights = Awaited<ReturnType<typeof getSampleWeights>>;

/** compendium principal component weights per sample */
export const getSampleWeights = async () => {
  /** map of sample name to weights */
  const makeMap = (table: SampleWeightsRow[]) =>
    Object.fromEntries(
      /** first col actually in format PROJECT_SRR, not sample SRS */
      table.map(({ sample, ...row }) => [sample.split("_").pop(), row]),
    );
  /** process files in parallel */
  const [full, asia, europe, noneurope] = await Promise.all([
    getTable<SampleWeightsRow>(fullUrl),
    getTable<SampleWeightsRow>(asiaUrl),
    getTable<SampleWeightsRow>(europeUrl),
    getTable<SampleWeightsRow>(noneuropeUrl),
  ]);
  return {
    full: makeMap(full),
    asia: makeMap(asia),
    europe: makeMap(europe),
    noneurope: makeMap(noneurope),
  };
};

expose({ getSampleWeights });

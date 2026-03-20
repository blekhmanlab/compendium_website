import type { SampleWeights } from "@/pages/projectionist/data/sample-weights";
import type { TaxaMap } from "@/pages/projectionist/data/taxa-map";
import { expose } from "comlink";
import { groupBy, isEqual, omit, pick, random, sum, uniqWith } from "lodash";
import { parse } from "papaparse";

/** allow aborting from outside worker */
let aborted = "";
export const abort = (reason = "aborted") => (aborted = reason);
export const resetAbort = () => (aborted = "");

/** allow setting onStatus listener from outside worker */
type OnStatus = (status: string) => void;
let status: OnStatus = () => {};
export const onStatus = (onStatus: OnStatus) => (status = onStatus);

export type UserData = Awaited<ReturnType<typeof parseUserData>>;

export type UserMeta = Awaited<ReturnType<typeof parseUserMeta>>;

export type UserProjected = Awaited<ReturnType<typeof projectUserData>>;

/** max read count to rarify down to */
const maxReads = 3000;

/** parse user uploaded tabular data (see example-data.txt) */
export const parseUserData = async (text: string) => {
  status("Parsing");

  /** trim whitespace to not get null rows at start/end */
  text = text.trim();

  /** parse data */
  const { data } = parse<(string | number)[]>(text, { dynamicTyping: true });

  if (aborted) throw Error(aborted);

  /** taxa (first row) */
  const taxa = data.shift() as string[];

  /** sample names (last col on right) */
  const samples = data.map((row) => row.pop() as string);

  /** read counts (> rows 1) */
  const reads = data.map((row) => row as number[]);

  if (aborted) throw Error(aborted);
  status("Rarifying");

  /** rarify reads */
  for (const counts of reads) {
    if (aborted) throw Error(aborted);

    /** total reads for sample */
    const total = sum(counts);
    /** how many reads we need to remove */
    const reduce = total - maxReads;
    for (let remove = reduce; remove > 0; remove--) {
      /** randomly select a read to remove */
      const randomRead = random(total);
      let cumulative = 0;
      /** find first col of reads that contains rand index */
      const index = counts.findIndex((count) => {
        cumulative += count;
        return cumulative > randomRead;
      });
      /** remove read from sample */
      counts[index] = (counts[index] ?? 0) - 1;
    }
  }

  if (aborted) throw Error(aborted);
  status("rCLR transforming");

  /** "robust centered log-ratio transformation" */
  for (const counts of reads) {
    if (aborted) throw Error(aborted);

    /** geometric mean */
    const nonZero = counts.filter((count) => count > 0);
    const product = nonZero.reduce(
      (product, count) => product * (count || 1),
      1,
    );
    const mean = product ** (1 / nonZero.length);

    counts.forEach((count, index) => {
      if (count === 0) return;
      /** log-ratio of count to geometric mean */
      counts[index] = Math.log(count / mean);
    });
  }

  return { taxa, samples, reads };
};

/** all available principal components */
export const pcs = [
  "PC1",
  "PC2",
  "PC3",
  "PC4",
  "PC5",
  "PC6",
  "PC7",
  "PC8",
] as const;

export type PC = (typeof pcs)[number];

/** parse user uploaded tabular data (see example-meta.txt) */
export const parseUserMeta = (text: string) => {
  /** parse data */
  const { data } = parse<Record<string, string | number>>(text, {
    dynamicTyping: true,
    header: true,
  });

  return data;
};

/** project user data against compendium data */
export const projectUserData = async (
  _taxa: UserData["taxa"],
  reads: UserData["reads"],
  samples: UserData["samples"],
  taxaMap: TaxaMap,
  sampleWeights: SampleWeights["full"],
) => {
  /** taxa mapped to split ranks */
  const taxa = _taxa.map((taxon) => taxaMap[taxon] ?? taxon);

  /** drop genus rank to consolidate at the family level */
  let consolidatedTaxa = taxa.map((taxon) =>
    typeof taxon === "object" ? omit(taxon, "genus") : taxon,
  );

  /** group together indices that are the same */
  const indices: number[][] = Object.values(
    groupBy(Object.entries(consolidatedTaxa), ([, taxon]) =>
      stringifyTaxon(taxon),
    ),
  ).map((group) => group.map(([index]) => Number(index)));

  /** consolidate taxa by consolidatedTaxa */
  consolidatedTaxa = uniqWith(consolidatedTaxa, isEqual);

  /** consolidate reads by consolidatedTaxa */
  const consolidatedReads = reads.map((row) =>
    indices.map((group) => sum(group.map((index) => row[index] ?? 0))),
  );

  /** projected principal components for each sample */
  const projected: Record<string, number>[] = [];

  samples.forEach((sampleName, sampleIndex) => {
    /** principal components for this sample */
    const sampleProjected: Record<string, number> = {};

    for (const pc of pcs) {
      if (aborted) throw Error(aborted);
      status(`Projecting ${pc} ${sampleName}`);

      /** calculate projected principal component */
      const total = sum(
        consolidatedTaxa.map(
          (taxon, taxonIndex) =>
            (consolidatedReads[sampleIndex]?.[taxonIndex] ?? 0) *
            (sampleWeights[stringifyTaxon(taxon)]?.[pc] ?? 0),
        ),
      );

      /** add principal component value */
      sampleProjected[pc] = total;
    }

    projected.push(sampleProjected);
  });

  return projected;
};

/** convert taxon object to string for easier compare/lookup/etc */
const stringifyTaxon = (value: object | string) =>
  typeof value === "object"
    ? JSON.stringify(
        pick(value, ["kingdom", "phylum", "class", "order", "family", "genus"]),
      )
    : value;

expose({
  parseUserData,
  parseUserMeta,
  projectUserData,
  abort,
  resetAbort,
  onStatus,
});

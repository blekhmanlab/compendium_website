import type { TaxonPCs } from "@/pages/projectionist/data/taxon-pcs";
import { expose } from "comlink";
import { groupBy, isEqual, omit, random, sum, uniqWith } from "lodash";
import { inferSchema, initParser } from "udsv";

/** max read count to rarify down to */
const maxReads = 3000;

/** max PCs to consider */
export const maxPCs = 8;

export type PC = `PC${number}`;

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

/** parse user uploaded tabular data (see example-data.txt) */
export const parseUserData = async (text: string) => {
  status("Parsing");

  /** trim whitespace to not get null rows at start/end */
  text = text.trim();

  /** parse data */
  const schema = inferSchema(text);
  const parser = initParser(inferSchema(text));
  const data = parser.typedArrs<(string | number)[]>(text);

  if (aborted) throw Error(aborted);

  /** taxa (header row column names) */
  const taxa = schema.cols.map((col) => col.name);

  /** ignore last header row column (sample name) */
  taxa.pop();

  /** sample names (last col on right) */
  const samples = data.map((row) => String(row.pop()));

  /** read counts (> rows 1) */
  const reads = data.map((row) => row.map(Number));

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

type Meta = { sample: string; [key: string]: string | number };

/** parse user uploaded tabular data (see example-meta.txt) */
export const parseUserMeta = (text: string) => {
  /** parse data */
  const schema = inferSchema(text);
  const parser = initParser(schema);
  const data = parser.typedObjs<Meta>(text);
  return Object.fromEntries(data.map(({ sample, ...row }) => [sample, row]));
};

/** project user data against compendium data */
export const projectUserData = async (
  _taxa: UserData["taxa"],
  reads: UserData["reads"],
  samples: UserData["samples"],
  taxaMap: TaxaMap,
  taxonPCs: TaxonPCs[string],
) => {
  /** taxa mapped to split ranks */
  const taxa = _taxa
    .map((taxon) => taxaMap[taxon])
    .filter((taxon) => taxon !== undefined);

  /** drop genus rank to consolidate at the family level */
  let consolidatedTaxa = taxa.map((taxon) => omit(taxon, "genus"));

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
  const projected: Record<PC, number>[] = [];

  samples.forEach((sampleName, sampleIndex) => {
    /** principal components for this sample */
    const sampleProjected: Record<string, number> = {};

    for (const pc of pcs) {
      if (aborted) throw Error(aborted);
      status(`Projecting ${pc} ${sampleName}`);

      /** calculate projected principal component */
      const total = sum(
        consolidatedTaxa.map((taxon, taxonIndex) => {
          /** user pc */
          const user = consolidatedReads[sampleIndex]?.[taxonIndex];
          /** compendium pc */
          const compendium = taxonPCs[stringifyTaxon(taxon)]?.[pc];
          return (user ?? 0) * (compendium ?? 0);
        }),
      );

      /** add principal component value */
      sampleProjected[pc] = total;
    }

    projected.push(sampleProjected);
  });

  return Object.fromEntries(
    projected.map((pcs, index) => [samples[index] ?? "", pcs]),
  );
};

/** stringify taxon into key */
const stringifyTaxon = ({
  kingdom,
  phylum,
  _class,
  order,
  family,
}: {
  kingdom: string;
  phylum: string;
  _class: string;
  order: string;
  family: string;
}) => [kingdom, phylum, _class, order, family].join("|");

expose({
  parseUserData,
  parseUserMeta,
  projectUserData,
  abort,
  resetAbort,
  onStatus,
});

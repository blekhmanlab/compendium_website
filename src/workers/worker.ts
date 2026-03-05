import { expose } from "comlink";
import { groupBy, isEqual, omit, pick, random, sum, uniqWith } from "lodash";
import { parse } from "papaparse";
import _compendiumProjected from "@/pages/projectionist/data/compendium-projected-full.tsv?raw";
import _compendiumWeights from "@/pages/projectionist/data/compendium-weights.tsv?raw";
import _taxaMap from "@/pages/projectionist/data/taxa-map.tsv?raw";
import { type UserMeta } from "@/pages/projectionist/Projectionist";

/**
 * note: every time you communicate with a web worker, the message content must
 * be serialized/deserialized, which can easily be the biggest bottleneck with
 * large data.
 */

/** progress func type */
type Progress = (status: string, shouldCancel?: true) => Promise<void>;

/** currently set progress func */
let progress: Progress | undefined;

/** expose method to set progress func */
export const setProgress = (func: Progress) => (progress = func);

/** is aborted */
let aborted = "";

/** abort func */
export const abort = (reason = "aborted") => (aborted = reason);

/** normalize strings for comparison */
const normalize = (string: string) =>
  string.replaceAll("_", " ").replaceAll(/\s/g, " ").toLowerCase();

/** exact (case-insensitive) search on large list of items */
export const exactSearch = <Entry extends Record<string, unknown>>(
  /** array of objects */
  list: Entry[],
  /** object keys to search */
  keys: string[],
  /** string to search */
  search: string,
) =>
  list.filter((entry) => {
    if (aborted) throw Error(aborted);
    return normalize(
      keys
        .map((key) => String(entry[key] ?? ""))
        .join(" ")
        .toLowerCase(),
    ).includes(normalize(search));
  });

/** fuzzy search on large list of items */
export const fuzzySearch = <Entry extends Record<string, unknown>>(
  /** array of objects */
  list: Entry[],
  /** object key to search */
  keys: string[],
  /** string to search */
  search: string,
  /** similarity threshold */
  threshold = 0.25,
): Entry[] =>
  list.filter((entry) => {
    if (aborted) throw Error(aborted);
    return (
      nGramSimilarity(
        normalize(keys.map((key) => String(entry[key] ?? "")).join(" ")),
        normalize(search),
      ) > threshold
    );
  });

/** split string into n-grams */
const nGrams = (value: string, n = 3) => {
  /** add start/end padding */
  const pad = " ".repeat(n - 1);
  value = pad + value + pad;
  /** chunk */
  return Array(value.length - n + 1)
    .fill("")
    .map((_, index) => value.slice(index, index + n));
};

/** calc similarity score https://stackoverflow.com/a/79343803/2180570 */
const nGramSimilarity = (stringA: string, stringB: string, n = 3) => {
  if (stringA === stringB) return 1;

  const a = new Set(nGrams(stringA, n));
  const b = new Set(nGrams(stringB, n));

  const common = a.intersection(b);
  const total = a.union(b);

  return common.size / (total.size || Infinity);
};

/** convert taxon object to string for easier compare/lookup/etc */
const stringifyTaxon = (value: object | string) =>
  typeof value === "object"
    ? JSON.stringify(
        pick(value, ["kingdom", "phylum", "class", "order", "family", "genus"]),
      )
    : value;

/** max read count to rarify down to */
const maxReads = Infinity;

/** parse user uploaded tabular data (see example-data.txt) */
export const parseUserData = (text: string) => {
  progress?.("Parsing");

  /** trim whitespace to not get null rows at start/end */
  text = text.trim();

  /** parse data */
  const { data } = parse<[...number[], string]>(text, { dynamicTyping: true });

  if (aborted) throw Error(aborted);

  /** taxa row, mapped to split ranks */
  const taxa = (data.shift() as string[]).map(
    (taxon) => taxaMap[taxon] ?? taxon,
  );

  /** sample name col (last col on right) */
  const samples = data.map((row) => row.pop() as string);

  /** read count rows */
  const reads = data.map((row) => row as number[]);

  if (aborted) throw Error(aborted);
  progress?.("Rarifying");

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
  progress?.("rCLR transforming");

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
    for (const pc of ["PC1", "PC2"] as const) {
      if (aborted) throw Error(aborted);
      progress?.(`Projecting ${pc} ${sampleName}`);

      /** calculate projected principal component */
      const total = sum(
        consolidatedTaxa.map(
          (taxon, taxonIndex) =>
            (consolidatedReads[sampleIndex]?.[taxonIndex] ?? 0) *
            (compendiumWeights[stringifyTaxon(taxon)]?.[pc] ?? 0),
        ),
      );

      /** add principal component value */
      sampleProjected[pc] = total;
    }

    projected.push(sampleProjected);
  });

  console.log({ taxa, samples, projected });

  return { taxa, samples, projected };
};

/** parse user uploaded tabular data (see example-meta.txt) */
export const parseUserMeta = (text: string) => {
  /** parse data */
  const { data } = parse<UserMeta[number]>(text, {
    dynamicTyping: true,
    header: true,
  });

  return data;
};

type TaxaMap = {
  /** full taxon name */
  taxon: string;
  /** explicit ranks */
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
};

/** map of full taxon name to split ranks */
const taxaMap = Object.fromEntries(
  parse<TaxaMap>(_taxaMap, { header: true }).data.map(({ taxon, ...entry }) => [
    /** convert all non-letter characters to periods */
    /** (we're expecting user to upload in this format, from DADA2) */
    taxon.replaceAll(/\W/g, "."),
    entry,
  ]),
);

type CompendiumWeights = {
  /** taxon ranks */
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  /** principal component values */
  PC1: number;
  PC2: number;
  PC3: number;
  PC4: number;
  PC5: number;
  PC6: number;
  PC7: number;
  PC8: number;
};

/** map of taxon name to compendium principal component weights */
export const compendiumWeights = Object.fromEntries(
  parse<CompendiumWeights>(_compendiumWeights, {
    dynamicTyping: true,
    header: true,
  }).data.map((entry) => [stringifyTaxon(entry), entry]),
);

type CompendiumProjected = {
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
  /** ??? */
  projection: string;
};

/** map of sample name to compendium projected principal component values */
export const compendiumProjected = Object.fromEntries(
  parse<CompendiumProjected>(_compendiumProjected, {
    dynamicTyping: true,
    header: true,
  }).data.map((entry) => [entry.sample, entry]),
);

expose({
  exactSearch,
  fuzzySearch,
  parseUserData,
  parseUserMeta,
  setProgress,
  abort,
});

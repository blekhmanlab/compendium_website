import { expose } from "comlink";
import {
  groupBy,
  isEmpty,
  isEqual,
  omit,
  pick,
  random,
  sum,
  uniqWith,
} from "lodash";
import { parse } from "papaparse";
import compendiumProjectedFile from "@/pages/projectionist/data/compendium-projected-full.tsv?url";
import compendiumWeightsFile from "@/pages/projectionist/data/compendium-weights.tsv?url";
import taxaMapFile from "@/pages/projectionist/data/taxa-map.tsv?url";
import { workerUtils } from "@/workers";

export const { progress, setProgress, aborted, abort } = workerUtils();

/** convert taxon object to string for easier compare/lookup/etc */
const stringifyTaxon = (value: object | string) =>
  typeof value === "object"
    ? JSON.stringify(
        pick(value, ["kingdom", "phylum", "class", "order", "family", "genus"]),
      )
    : value;

/** get text file contents */
const fetchText = async (url: string) => await (await fetch(url)).text();

/** max read count to rarify down to */
const maxReads = 3000;

/** parse user uploaded tabular data (see example-data.txt) */
export const parseUserData = async (text: string) => {
  /** get compendium data */
  const taxaMap = await getTaxaMap();
  const compendiumWeights = await getCompendiumWeights();

  progress("Parsing");

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
  progress("Rarifying");

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
  progress("rCLR transforming");

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
    const pcs = [
      "PC1",
      "PC2",
      "PC3",
      "PC4",
      "PC5",
      "PC6",
      "PC7",
      "PC8",
    ] as const;
    for (const pc of pcs) {
      if (aborted) throw Error(aborted);
      progress(`Projecting ${pc} ${sampleName}`);

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

  return { taxa, samples, projected };
};

/** parse user uploaded tabular data (see example-meta.txt) */
export const parseUserMeta = (text: string) => {
  /** parse data */
  const { data } = parse<Record<string, string | number>>(text, {
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
let taxaMap: Record<string, Omit<TaxaMap, "taxon">> = {};

/** load on demand */
const getTaxaMap = async () => {
  progress("Loading taxa map");
  if (isEmpty(taxaMap)) {
    taxaMap = Object.fromEntries(
      parse<TaxaMap>(await fetchText(taxaMapFile), {
        header: true,
      }).data.map(({ taxon, ...entry }) => [
        /** convert all non-letter characters to periods */
        /** (we're expecting user to upload in this format, from DADA2) */
        taxon.replaceAll(/\W/g, "."),
        entry,
      ]),
    );
  }
  return taxaMap;
};

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
let compendiumWeights: Record<string, CompendiumWeights> = {};

/** load on demand */
const getCompendiumWeights = async () => {
  progress("Loading compendium weights");
  if (isEmpty(compendiumWeights)) {
    compendiumWeights = Object.fromEntries(
      parse<CompendiumWeights>(await fetchText(compendiumWeightsFile), {
        dynamicTyping: true,
        header: true,
      }).data.map((entry) => [stringifyTaxon(entry), entry]),
    );
  }
  return compendiumWeights;
};

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
let compendiumProjected: Record<string, CompendiumProjected> = {};

/** load on demand */
export const getCompendiumProjected = async () => {
  progress("Loading compendium projected");
  if (isEmpty(compendiumProjected)) {
    compendiumProjected = Object.fromEntries(
      parse<CompendiumProjected>(await fetchText(compendiumProjectedFile), {
        dynamicTyping: true,
        header: true,
      }).data.map((entry) => [entry.sample, entry]),
    );
  }
  return compendiumProjected;
};

/** parse compendium data */
export const parseCompendiumData = async () => {
  const taxa = await getTaxaMap();
  const weights = await getCompendiumWeights();
  const projected = await getCompendiumProjected();
  return {
    taxa: Object.values(taxa),
    weights: Object.values(weights),
    projected: Object.values(projected),
  };
};

expose({
  parseUserData,
  parseUserMeta,
  parseCompendiumData,
  setProgress,
  abort,
});

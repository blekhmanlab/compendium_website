import type { TaxonPCs } from "@/pages/projectionist/data/taxon-pcs";
import { expose } from "comlink";
import { groupBy, random, range, sum, uniq } from "lodash";

/** max read count to rarify down to */
const maxReads = 3000;

/** max PCs to consider */
export const maxPCs = 8;

/** available pc options */
export const PCs = range(1, maxPCs + 1).map(
  (index) => `PC${index}` satisfies PC,
);

export type PC = `PC${number}`;

/** available ordinations */
export const ordinations = ["full", "south-asia", "europe", "non-europe"];

export type UserReads = Awaited<ReturnType<typeof parseUserReads>>;

export type UserTaxa = Awaited<ReturnType<typeof parseUserTaxa>>;

export type UserMeta = Awaited<ReturnType<typeof parseUserMeta>>;

export type UserProjected = Awaited<ReturnType<typeof projectUserData>>;

/** parse user uploaded reads */
export const parseUserReads = async (text: string) => {
  message("Parsing");

  /** parse raw data */
  const data = parseTsv(text);

  /** sample names (col = 1, row > 1) */
  const samples = data.slice(1).map((col) => col[0] ?? "");

  /** taxa ids (row = 1, col > 1) */
  const taxa = data[0]?.slice(1) ?? [];

  /** read counts (row > 1, col > 1) */
  const reads = data
    .slice(1)
    .map((col) => col.slice(1).map((value) => Number(value) || 0));

  return { taxa, samples, reads };
};

/** parse user uploaded tabular taxa data */
export const parseUserTaxa = async (text: string) => {
  message("Parsing");

  /** parse raw data */
  const data = parseTsv(text);

  console.log(data);

  /** parse taxon ranks in order */
  const ranks = data.map(
    ([
      id = "",
      kingdom = "",
      phylum = "",
      _class = "",
      order = "",
      family = "",
      genus = "",
    ]) => ({ id, kingdom, phylum, _class, order, family, genus }),
  );

  return ranks;
};

type Meta = { sample: string; [key: string]: string | number };

/** parse user uploaded tabular data (see example-meta.txt) */
export const parseUserMeta = (text: string) => {
  message("Parsing");

  /** parse raw data */
  const data = parseTsv(text);

  /** convert to objects */
  const objects = toObjects<Meta>(data);

  /** map of sample to meta */
  const map = Object.fromEntries(
    objects.rows.map(({ sample, ...row }) => [sample, row]),
  );

  return map;
};

/** project user data against compendium data */
export const projectUserData = async (
  userReads: UserReads,
  userTaxa: UserTaxa,
  taxonPCs: TaxonPCs,
) => {
  message("Loading taxa");

  let taxa = userReads.taxa.map((taxon) => {
    /** use id to look up full taxon ranks */
    const full = userTaxa.find((t) => t.id === taxon);
    if (!full) throw Error(`Full taxon "${taxon}" not found in user taxa`);
    /** extract ranks, drop genus to consolidate at family level */
    const { kingdom, phylum, _class, order, family } = full;
    /** stringify taxon */
    return [kingdom, phylum, _class, order, family].join("|");
  });
  const samples = userReads.samples;
  let reads = userReads.reads;

  message("Consolidating taxa");

  /** group together col indices that are same taxon */
  const groups: number[][] = Object.values(
    groupBy(Object.entries(taxa), ([, taxon]) => taxon),
  ).map((group) => group.map(([col]) => Number(col)));

  /** consolidate taxa */
  taxa = uniq(taxa);

  message("Consolidating reads");

  /** consolidate reads */
  reads = reads.map((row) =>
    groups.map((group) =>
      sum(
        group.map((col) => {
          if (row[col] === undefined)
            throw Error(`Col ${col} row ${row} undefined`);
          return row[col];
        }),
      ),
    ),
  );

  message("Rarifying reads");

  /** rarify reads */
  for (const counts of reads) {
    /** total reads for sample */
    let total = sum(counts);
    /** how many reads we need to remove */
    const reduce = total - maxReads;
    for (let remove = reduce; remove > 0; remove--) {
      /** randomly select a read to remove */
      const randomRead = random(total - 1);
      let cumulative = 0;
      /** find first col of reads that contains rand index */
      const index = counts.findIndex((count) => {
        cumulative += count;
        return cumulative > randomRead;
      });
      if (counts[index] === undefined)
        throw Error("Read remove index out of bounds");
      /** remove read from sample */
      counts[index] = counts[index] - 1;
      /** update total */
      total--;
    }
  }

  message("rCLR transforming reads");

  /** "robust centered log-ratio transformation" */
  for (const counts of reads) {
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

  /** projected principal components for each sample */
  const projected: { [key: PC]: number }[] = [];

  message("Projecting samples");

  samples.forEach((sample, sampleIndex) => {
    /** principal components for this sample */
    const sampleProjected: Record<string, number> = {};

    for (const PC of PCs) {
      /** calculate projected principal component */
      const total = sum(
        taxa.map((taxon, taxonIndex) => {
          /** user pc */
          const user = reads[sampleIndex]?.[taxonIndex];
          if (user === undefined)
            throw Error(`Col ${taxonIndex} row ${sampleIndex} undefined`);
          /** compendium pc */
          const compendium = taxonPCs[taxon]?.[PC];
          if (compendium === undefined)
            throw Error(`Col ${PC} row ${taxon} undefined`);
          return user * compendium;
        }),
      );

      /** add principal component value */
      sampleProjected[PC] = total;
    }

    projected.push(sampleProjected);
  });

  return Object.fromEntries(
    projected.map((PCs, index) => {
      if (samples[index] === undefined)
        throw Error("Sample index out of bounds");
      return [samples[index], PCs];
    }),
  );
};

/** simple csv/tsv parser */
const parseTsv = (text: string) => {
  const delimiter = text.includes("\t") ? "\t" : ",";
  return text
    .split(/\r?\n/)
    .map((line) => line.split(delimiter))
    .filter((row) => row.length > 1 && row.some((cell) => cell.trim()));
};

/** convert parsed csv/tsv to objects */
const toObjects = <Type>(data: string[][]) => {
  const [cols = [], ...rows] = data;
  return {
    cols,
    rows: rows.map(
      (row) =>
        Object.fromEntries(
          row.map((cell, index) => [cols[index] ?? "", cell]),
        ) as Type & Record<string, string>,
    ),
  };
};

/** send message to main thread */
const message = (message: string) => onMessage?.(message);
/** callback to send messages to main thread */
let onMessage: (message: string) => void;
/** receive proxy callback from main thread */
const setOnMessage = (callback: typeof onMessage) => (onMessage = callback);

expose({
  parseUserReads,
  parseUserTaxa,
  parseUserMeta,
  projectUserData,
  setOnMessage,
});

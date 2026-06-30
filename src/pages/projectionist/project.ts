import type { TaxonPCs } from "@/pages/projectionist/data/taxon-pcs";
import { expose } from "comlink";
import { groupBy, random, range, sum, uniq } from "lodash";
import { inferSchema, initParser } from "udsv";

/** max read count to rarify down to */
const maxReads = 300;

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
  console.debug("Parsing");

  /** trim whitespace to not get null rows at start/end */
  text = text.trim();

  /** parse data */
  const schema = inferSchema(text);
  const parser = initParser(inferSchema(text));
  const data = parser.typedArrs<(string | number)[]>(text);

  /** sample names (first col) */
  const samples = data.map((row) => String(row.shift()));

  /** taxa ids (first row col names) */
  const taxa = schema.cols.map((col) => col.name);
  /** ignore first col */
  taxa.shift();

  /** read counts (> rows 1) */
  const reads = data.map((row) => row.map(Number));

  return { taxa, samples, reads };
};

/** parse user uploaded tabular taxa data */
export const parseUserTaxa = async (text: string) => {
  console.debug("Parsing");

  /** trim whitespace to not get null rows at start/end */
  text = text.trim();

  /** parse data */
  const parser = initParser(inferSchema(text));
  const data = parser.typedArrs<string[]>(text);

  return data.map(
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
};

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
  userReads: UserReads,
  userTaxa: UserTaxa,
  taxonPCs: TaxonPCs,
) => {
  console.debug("Loading taxa");

  let taxa = userReads.taxa.map((taxon) => {
    /** use id to look up full taxon ranks */
    const full = userTaxa.find((t) => t.id === taxon);
    if (!full) throw Error(`${taxon} not found in user taxa`);
    /** extract ranks, drop genus to consolidate at family level */
    const { kingdom, phylum, _class, order, family } = full;
    /** combine ranks */
    const ranks = [kingdom, phylum, _class, order, family];
    if (ranks.some((rank) => rank === undefined))
      throw Error(`Taxon ${taxon} missing rank`);
    /** stringify taxon */
    return ranks.join("|");
  });
  const samples = userReads.samples;
  let reads = userReads.reads;

  console.debug("Consolidating taxa");

  /** group together col indices that are same taxon */
  const groups: number[][] = Object.values(
    groupBy(Object.entries(taxa), ([, taxon]) => taxon),
  ).map((group) => group.map(([col]) => Number(col)));

  /** consolidate taxa */
  taxa = uniq(taxa);

  console.debug("Consolidating reads");

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

  console.debug("Rarifying reads");

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
      if (counts[index] === undefined) throw Error("undefined");
      /** remove read from sample */
      counts[index] = counts[index] - 1;
      /** update total */
      total--;
    }
  }

  console.debug("rCLR transforming reads");

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

  console.debug("Projecting samples");

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
      if (samples[index] === undefined) throw Error("undefined");
      return [samples[index], PCs];
    }),
  );
};

expose({
  parseUserReads,
  parseUserTaxa,
  parseUserMeta,
  projectUserData,
});

import { expose } from "comlink";

/**
 * note: every time you communicate with a web worker, the message content must
 * be serialized/deserialized, which can easily be the biggest bottleneck with
 * large data.
 */

/** example of function that takes long time to compute */
export const expensiveFunction = () => {
  progress?.("Starting");

  let total = 0;
  const big = 500000000;
  for (let a = 0; a < big; a++) {
    if (a % (big / 100) === 0) progress?.(`${(100 * a) / big}% done`);
    total += Math.sqrt(Math.random()) ** 2;
  }

  return total;
};

/** normalize strings for comparison */
const normalize = (string: string) =>
  string.replaceAll("_", " ").replaceAll(/\s/g, " ").toLowerCase();

/** exact (case-insensitive) search on large list of items */
export const exactSearch = <Entry extends Record<string, unknown>>(
  /** array of objects */
  list: readonly Entry[],
  /** object keys to search */
  keys: readonly (keyof Entry)[],
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
  list: readonly Entry[],
  /** object key to search */
  keys: readonly (keyof Entry)[],
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

expose({ expensiveFunction, exactSearch, fuzzySearch, setProgress, abort });

import { expose } from "comlink";

/** normalize strings for comparison */
const normalize = (string: string) =>
  string.replaceAll("_", " ").replaceAll(/\s/g, " ").toLowerCase();

/** exact (case-insensitive) search on large list of items */
export const exactSearch = <List extends Record<string, unknown>[]>(
  /** array of objects */
  list: List,
  /** object keys to search */
  keys: string[],
  /** string to search */
  search: string,
) =>
  list.filter((entry) =>
    normalize(
      keys
        .map((key) => String(entry[key] ?? ""))
        .join(" ")
        .toLowerCase(),
    ).includes(normalize(search)),
  ) as List;

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
  list.filter(
    (entry) =>
      nGramSimilarity(
        normalize(keys.map((key) => String(entry[key] ?? "")).join(" ")),
        normalize(search),
      ) > threshold,
  );

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

expose({ exactSearch, fuzzySearch });

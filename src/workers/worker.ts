import { expose } from "comlink";
import trigramSimilarity from "trigram-similarity";

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

/** fuzzy (trigram) search on large list of items */
export const fuzzySearch = <Entry extends { [key: string]: unknown }>(
  /** array of objects */
  list: Entry[],
  /** key object to search */
  key: keyof Entry,
  /** string to search */
  search: string,
  /** similarity threshold */
  threshold = 0.25
): Entry[] =>
  list.filter(
    (entry) => trigramSimilarity(String(entry[key]), search) > threshold
  );

/** progress callback type */
type OnProgress = (status: string) => void;

/** currently set progress callback */
let progress: OnProgress | undefined;

/** expose method to set progress callback */
export const onProgress = (callback: OnProgress) => (progress = callback);

expose({ expensiveFunction, fuzzySearch, onProgress });

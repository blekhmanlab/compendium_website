import { expose } from "comlink";
import Fuse from "fuse.js";

let searcher: Fuse<Record<string, unknown>>;

/** set list of entries to search */
export const set = (list: Record<string, unknown>[], keys: string[]) => {
  searcher = new Fuse(list, { keys, threshold: 0.2, ignoreLocation: true });
};

/** fuzzy search list of entries */
export const search = (search: string) =>
  searcher?.search(search).map(({ item }) => item) ?? [];

expose({ set, search });

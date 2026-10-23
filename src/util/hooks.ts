import type { Remote } from "comlink";
import type * as SearchAPI from "@/util/search";
import { useCallback, useEffect, useState } from "react";
import { useEventListener } from "@reactuses/core";
import { wrap } from "comlink";
import { isEqual } from "lodash";
import { getStyles, getTheme } from "@/util/dom";
import SearchWorker from "@/util/search?worker";

/** reactive styles */
export const useStyles = () => {
  const [styles, setStyles] = useState(getStyles);
  const update = useCallback(async () => setStyles(getStyles()), []);
  /** update when document done loading */
  useEventListener("load", update, window);
  /** update when fonts done loading */
  useEventListener("loadingdone", update, document.fonts);
  /** update on manual style change event */
  useEventListener(styleChange, update, window);
  return styles;
};

/** event for manual style change */
const styleChange = "styleschange";

/** manually update reactive styles */
export const updateStyles = () =>
  window.dispatchEvent(new CustomEvent(styleChange));

/** reactive theme variables */
export const useTheme = () => getTheme(useStyles());

/** check if value changed from previous render */
export const useChanged = <Value>(value: Value) => {
  const [prev, setPrev] = useState<Value>();
  const changed = !isEqual(prev, value);
  if (changed) setPrev(value);
  return changed;
};

/** fuzzy search */
export const useSearch = <Entry extends Record<string, unknown>>(
  list: Entry[],
  fields: string[],
  search: string,
) => {
  /** match results */
  const [matches, setMatches] = useState<Entry[]>([]);
  /** status of async search */
  const [status, setStatus] = useState<"loading" | "error" | "">("");
  /** worker wrapper */
  const [worker, setWorker] = useState<Remote<typeof SearchAPI>>();

  useEffect(() => {
    /** create */
    const worker = new SearchWorker();
    const wrapper = wrap<typeof SearchAPI>(worker);
    // eslint-disable-next-line
    setWorker(() => wrapper);
    /** cleanup */
    return () => {
      worker.terminate();
      setWorker(undefined);
    };
  }, []);

  /** set search list */
  useEffect(() => {
    worker?.set(list, fields);
  }, [worker, list, fields]);

  useEffect(() => {
    if (!worker) return;

    let latest = true;

    (async () => {
      /** if search empty, skip work */
      if (!search.trim()) {
        setMatches(list);
        setStatus("");
        return;
      }
      /** perform search in worker */
      try {
        setStatus("loading");
        const matches = (await worker?.search(search)) ?? [];
        if (!latest) return;
        setMatches(matches as Entry[]);
        setStatus("");
      } catch (error) {
        console.warn(error);
        if (!latest) return;
        setStatus("error");
      }
    })();

    return () => {
      latest = false;
    };
  }, [worker, list, search]);

  return [matches, status] as const;
};

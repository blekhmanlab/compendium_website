import type { Remote } from "comlink";
import { useCallback, useState } from "react";
import { useLatest } from "@reactuses/core";
import { wrap } from "comlink";

/** run async operation in worker, with status, error handling, de-dupe, etc. */
export const useWorker = <API, Data>(
  Worker: new () => Worker,
  func: (worker: Remote<API>) => Promise<Data>,
) => {
  /** data returned from async operation */
  const [data, setData] = useState<Data>();
  /** status of async operation */
  const [status, setStatus] = useState<
    "loading" | "error" | "" | (string & {})
  >("");

  /** stable version of func that doesn't affect react dep arrays */
  const _func = useLatest(func);

  /** run async operation */
  const run = useCallback(() => {
    /** mark this run as latest */
    let latest = true;

    /** create new worker thread */
    const worker = new Worker();
    const wrapper = wrap<API>(worker);
    (async () => {
      try {
        /** set loading state */
        setStatus("loading");

        /** listen for more status updates from worker */
        /** run async operation in worker thread */
        const data = await _func.current(wrapper);
        /** if this is still the latest run */
        if (latest) {
          /** success */
          setData(data);
          setStatus("");
        }
      } catch (error) {
        /** if this is still the latest run, update error status */
        if (latest) setStatus("error");
      }
    })();

    /** cleanup func (usually for useEffect) */
    return () => {
      /** mark this run as stale */
      latest = false;
      /** abort any pending work */
      worker.terminate();
    };
  }, [Worker, _func]);

  return [data, status, run] as const;
};

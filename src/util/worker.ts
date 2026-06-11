import type { Remote } from "comlink";
import { useEffect, useState } from "react";
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

  /** run async operation */
  useEffect(() => {
    /** mark this run as latest */
    let latest = true;

    /** create new worker thread */
    const worker = new Worker();
    const wrapper = wrap<API>(worker);

    (async () => {
      try {
        /** set loading state */
        setStatus("loading");

        /** run async operation in worker thread */
        const data = await func(wrapper);

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
  }, [Worker, func]);

  return [data, status] as const;
};

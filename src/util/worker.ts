import type { Remote } from "comlink";
import { useEffect, useState } from "react";
import { proxy, wrap } from "comlink";

type APIShape = Record<PropertyKey, unknown> & {
  setOnMessage?: (func: (message: string) => void) => void;
};

/** run async operation in worker, with status, error handling, de-dupe, etc. */
export const useWorker = <API extends APIShape, Data>(
  Worker: new () => Worker,
  func: (worker: Remote<API>) => Promise<Data>,
) => {
  /** data returned from async operation */
  const [data, setData] = useState<Data>();
  /** status of async operation */
  const [status, setStatus] = useState<"loading" | "error" | "">("");
  /** status message */
  const [message, setMessage] = useState<string>("");

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

        /** set message from worker */
        if (typeof wrapper.setOnMessage === "function")
          await wrapper.setOnMessage(
            proxy((message) => {
              if (latest) setMessage(message);
            }),
          );

        /** run async operation in worker thread */
        const data = await func(wrapper);

        /** if this is still the latest run */
        if (latest) {
          latest = false;
          /** success */
          setData(data);
          setStatus("");
          setMessage("");
        }
      } catch (error) {
        /** if this is still the latest run, update error status */
        if (latest) {
          latest = false;
          setStatus("error");
          setMessage(String((error as Error).message));
        }
      }
    })();

    /** cleanup func */
    return () => {
      /** mark this run as stale */
      latest = false;
      /** abort any pending work */
      worker.terminate();
    };
  }, [Worker, func]);

  return [data, status, message] as const;
};

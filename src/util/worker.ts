import type { Remote } from "comlink";
import { useEffect, useState } from "react";
import { proxy, wrap } from "comlink";

type APIShape = Record<PropertyKey, unknown> & {
  setOnMessage?: (func: (message: string) => void) => void;
};

/** run async operation in worker, with status, error handling, de-dupe, etc. */
export const useWorker = <API extends APIShape, Data>(
  Worker: new () => Worker,
  func: ((worker: Remote<API>) => Promise<Data>) | undefined,
) => {
  /** data returned from async operation */
  const [data, setData] = useState<Data>();
  /** status of async operation */
  const [status, setStatus] = useState<"loading" | "error" | "">("");
  /** status message */
  const [message, setMessage] = useState<string>("");

  /** run async operation */
  useEffect(() => {
    /** skip work if no func provided */
    if (!func) return;

    /** mark this run as latest */
    let latest = true;

    /** create new worker thread */
    const worker = new Worker();
    const wrapper = wrap<API>(worker);

    (async () => {
      try {
        /** set loading state */
        setStatus("loading");

        try {
          if (typeof wrapper.setOnMessage === "function")
            await wrapper.setOnMessage?.(
              proxy((message: string) => {
                if (latest) setMessage(message);
              }),
            );
        } catch {
          /** worker doesn't implement, ignore */
        }

        /** run async operation in worker thread */
        const data = await func(wrapper);

        if (!latest) return;
        /** success */
        latest = false;
        setData(data);
        setStatus("");
        setMessage("");
      } catch (error) {
        if (!latest) return;
        /** error */
        latest = false;
        console.warn(error);
        setStatus("error");
        setMessage(String((error as Error).message));
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

  /** when work skipped, ignore any state left over from a previous run */
  if (!func) return [undefined, "", ""] as const;

  return [data, status, message] as const;
};

import type { Remote } from "comlink";
import { useCallback, useState } from "react";
import { proxy } from "comlink";

type Worker = Remote<{
  resetAbort?: () => unknown;
  abort?: () => unknown;
  onStatus?: (onStatus: (status: string) => void) => unknown;
}>;

/** run async operation in worker, with status, error handling, de-dupe, etc. */
export const useWorker = <Data>(worker: Worker) => {
  /** data returned from async operation */
  const [data, setData] = useState<Data>();
  /** status of async operation */
  const [status, setStatus] = useState<
    "loading" | "error" | "" | (string & {})
  >("");

  /** run async operation */
  const run = useCallback(
    (start: () => Promise<Data>) => {
      /** mark this run as latest */
      let latest = true;

      setStatus("loading");

      /** reset any previous abort state */
      if (typeof worker.resetAbort === "function")
        worker.resetAbort().catch(() => {});

      /** subscribe to status updates */
      if (typeof worker.onStatus === "function")
        worker
          .onStatus(
            proxy((status: string) => {
              if (latest) setStatus(status);
            }),
          )
          .catch(() => {});

      /** start async operation */
      start()
        .then((result) => {
          /** success */
          if (latest) {
            setData(result);
            setStatus("");
          } else {
            /** ignore stale result */
            console.warn("stale");
          }
        })
        .catch((error) => {
          if (String(error).match(/aborted/i)) {
            /** ignore aborted error */
            console.warn("aborted");
          } else if (!latest) {
            /** ignore stale error */
            console.warn("stale");
          } else {
            /** all other errors */
            setStatus("error");
            console.warn(error);
          }
        })
        /** mark this run as stale */
        .finally(() => (latest = false));

      /** onCleanup func (usually for useEffect) */
      return () => {
        /** mark this run as stale */
        latest = false;
        /** abort any pending work */
        if (typeof worker.abort === "function") worker.abort().catch(() => {});
      };
    },
    [worker],
  );

  return [data, status, run] as const;
};

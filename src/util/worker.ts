import { useCallback, useState } from "react";
import { proxy } from "comlink";

type BaseWorker = {
  resetAbort?: () => void;
  abort?: () => void;
  onStatus?: (onStatus: (status: string) => void) => void;
};

/** run async operation in worker, with status, error handling, de-dupe, etc. */
export const useWorker = <Data>(worker: BaseWorker) => {
  /** data returned from async operation */
  const [data, setData] = useState<Data>();
  /** status of async operation */
  const [status, setStatus] = useState<
    "loading" | "error" | "" | (string & {})
  >("");

  /** run async operation */
  const run = useCallback(
    (start: () => Promise<Data>) => {
      let latest = true;
      setStatus("loading");
      worker.resetAbort?.();
      worker.onStatus?.(
        proxy((status) => {
          if (latest) setStatus(status);
        }),
      );
      start()
        .then((result) => {
          /** success */
          if (latest) {
            setData(result);
            setStatus("");
          } else console.warn("stale");
        })
        .catch((error) => {
          /** error */
          if (String(error).match(/aborted/i)) console.warn("aborted");
          else if (!latest) console.warn("stale");
          else {
            setStatus("error");
            console.warn(error);
          }
        })
        .finally(() => (latest = false));
      /** onCleanup func (usually for useEffect) */
      return () => {
        latest = false;
        worker.abort?.();
      };
    },
    [worker],
  );

  return [data, status, run] as const;
};

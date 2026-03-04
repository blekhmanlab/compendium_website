import { useEffect, useMemo, useState } from "react";
import { proxy, wrap } from "comlink";
import { sleep } from "@/util/async";
import type * as worker from "./worker";
import Worker from "./worker?worker";

type API = typeof worker;

/** convenience function to call worker method and return results and status */
export const useThread = <Result>(
  /** method to run from worker */
  method: (worker: API) => Result,
) => {
  /** create worker thread for this instance */
  const worker = useMemo(() => wrap<API>(new Worker()), []);

  /** state/progress */
  const [status, setStatus] = useState("");

  /** returned data */
  const [data, setData] = useState<Awaited<Result>>();

  useEffect(() => {
    /** controller to abort process later */
    const abort = new AbortController();

    /** reset status */
    setStatus("loading");
    /** reset data */
    setData(undefined);

    /** flag to indicate if processing has resolved */
    let resolved = false;

    /** set progress func */
    worker.setProgress(
      proxy(async (status) => {
        /** make sure on progress message hasn't arrived after processing */
        if (resolved) return;
        /** update progress */
        setStatus(status);
      }),
    );

    /** handle abort */
    const onAbort = () => {
      worker.abort(abort.signal.reason);
      console.warn(abort.signal.reason);
    };
    abort.signal.addEventListener("abort", onAbort);

    (async () => {
      try {
        /** execute specified method */
        await sleep(200);
        const result = await method(worker as unknown as API);
        setData(result);
        setStatus("");
      } catch (error) {
        setStatus("error");
        console.error(error);
      } finally {
        /** mark that processing has resolved */
        resolved = true;
      }
    })();

    return () => {
      abort.signal.removeEventListener("abort", onAbort);
      abort.abort("Stale");
    };
  }, [worker, method]);

  return [data, status] as const;
};

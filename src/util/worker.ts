import type { Remote } from "comlink";
import { useEffect, useMemo, useState } from "react";
import { proxy, wrap } from "comlink";

/** minimum interface every worker must expose */
type WorkerBase = {
  setProgress: (func: (status: string) => Promise<void>) => void;
  abort: (reason?: string) => void;
};

/** convenience function to call worker and return results and status */
export const useWorker = <_Worker extends WorkerBase, Result>(
  /** worker constructor, imported with import X from "./worker.ts?worker" */
  WorkerConstructor: new () => Worker,
  /** callback receiving wrapped worker. return type determines data. */
  callback: (worker: Remote<_Worker>) => Result,
) => {
  const worker = useMemo(
    () => wrap<_Worker>(new WorkerConstructor()),
    [WorkerConstructor],
  );

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
        const result = await callback(worker);
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

    /** cleanup */
    return () => {
      abort.signal.removeEventListener("abort", onAbort);
      abort.abort("Stale");
    };
  }, [worker, callback]);

  return [data, status] as const;
};

/** progress and abort utils */
export const progressUtils = () => {
  /** progress func type */
  type Progress = (status: string, shouldCancel?: true) => Promise<void>;

  /** currently set progress func */
  let progress: Progress = () => Promise.resolve();

  /** expose method to set progress func */
  const setProgress = (func: Progress) => (progress = func);

  /** is aborted */
  let aborted = "";

  /** abort func */
  const abort = (reason = "aborted") => (aborted = reason);

  return { progress, setProgress, aborted, abort };
};

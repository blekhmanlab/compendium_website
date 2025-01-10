import type { Remote } from "comlink";
import { proxy, wrap } from "comlink";
import { sleep } from "@/util/async.ts";
import Worker from "./worker?worker";

/** get exports from worker to define types for methods/objects/etc. */
type API = typeof import("./worker.ts");

/** convenience method for creating worker */
export const thread = <Type>(
  /** method to run from worker */
  method: (worker: Remote<API>) => Promise<Type>,
  /** abort controller to reject */
  abort?: AbortController,
  /** method to run on progress update */
  onProgress?: (status: string) => void,
): Promise<Type> =>
  new Promise((resolve, reject) => {
    /** flag for if final result has happened */
    let resolved = false;
    /** create worker instance */
    const worker = wrap<API>(new Worker());
    /** set progress func */
    worker.setProgress(
      proxy(async (status) => {
        /** make sure on progress message hasn't arrived after final result */
        if (!resolved)
          /** update progress */
          onProgress?.(status);
      }),
    );
    /** handle abort */
    const onAbort = () => {
      worker.abort(abort?.signal.reason);
      console.warn(abort?.signal.reason);
    };
    abort?.signal.addEventListener("abort", onAbort);
    /** execute specified method */
    method(worker)
      /** return final result */
      .then(async (result) => {
        /** for testing */
        await sleep(100);
        resolve(result);
      })
      /** catch errors */
      .catch(reject)
      .finally(() => {
        /** mark that final result has happened */
        resolved = true;
        abort?.signal.removeEventListener("abort", onAbort);
      });
  });

/** example of using thread method */
export const example = async () => {
  /** in sequence */
  const a = await thread(
    (worker) => worker.expensiveFunction(),
    undefined,
    (status) => console.debug(status),
  );

  /** in parallel */
  const [b, c] = await Promise.all([
    thread(
      (worker) => worker.expensiveFunction(),
      undefined,
      (status) => console.debug(status),
    ),
    thread(
      (worker) => worker.expensiveFunction(),
      undefined,
      (status) => console.debug(status),
    ),
  ]);

  console.debug(a, b, c);
};

import type { Remote } from "comlink";
import { proxy, wrap } from "comlink";
import DataWorker from "./worker?worker";

/** get exports from worker to define types for methods/objects/etc. */
type API = typeof import("./worker.ts");

/** convenience method for creating worker */
export const thread = <Type>(
  /** method to run from worker */
  method: (worker: Remote<API>) => Promise<Type>,
  /** method to run on progress update */
  onProgress?: (status: string) => void,
): Promise<Type> =>
  new Promise((resolve, reject) => {
    /** flag for if final result has happened */
    let resolved = false;
    /** create worker instance */
    const worker = wrap<API>(new DataWorker());
    /** set on progress callback */
    worker.onProgress(
      proxy((status) => {
        /** make sure on progress message hasn't arrived after final result */
        if (!resolved)
          /** update progress */
          onProgress?.(status);
      }),
    );
    /** execute specified method */
    method(worker)
      /** return final result */
      .then(resolve)
      /** catch errors */
      .catch(reject)
      /** mark that final result has happened */
      .finally(() => (resolved = true));
  });

/** example of using thread method */
export const example = async () => {
  /** in sequence */
  const a = await thread(
    (worker) => worker.expensiveFunction(),
    (status) => console.debug(status),
  );

  /** in parallel */
  const [b, c] = await Promise.all([
    thread(
      (worker) => worker.expensiveFunction(),
      (status) => console.debug(status),
    ),
    thread(
      (worker) => worker.expensiveFunction(),
      (status) => console.debug(status),
    ),
  ]);

  console.debug(a, b, c);
};

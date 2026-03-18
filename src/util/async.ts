/** wait */
export const sleep = async (ms = 0): Promise<void> =>
  new Promise((resolve) => globalThis.setTimeout(resolve, ms));

/**
 * wait for next animation frame (after async tasks like react rendering but
 * before browser repaint)
 */
export const frame = () =>
  new Promise((resolve) => requestAnimationFrame(() => resolve(true)));

/** run func until it returns truthy value, trying periodically, up to a limit */
export const waitFor = async <T>(
  func: () => T,
  timeout = 1000,
  interval = 50,
): Promise<NonNullable<T>> => {
  for (let check = 0; check < timeout / interval; check++) {
    const result = func();
    if (result) return result;
    await sleep(interval);
  }
  throw Error("waitFor timed out");
};

import { parse } from "papaparse";
import type { CSV } from "./";

/** fetch file and parse as csv */
export const parseData = async (
  url: string,
  computeTotals: boolean
): Promise<CSV> => {
  console.info(url, "Fetching");

  self.postMessage("hi");

  const response = await fetch(import.meta.env.BASE_URL + url);
  if (!response.ok) throw Error("Response not OK ");

  console.info(url, "Parsing as text");
  const text = await response.text();

  console.info(url, "Parsing as csv ");
  const parsed = await parse(text.trim(), { dynamicTyping: true });
  const data = parsed.data as CSV;

  if (computeTotals) {
    console.info(url, "Computing totals");
    const totalRow: [string, ...number[]] = [""];
    for (let col = 1; col < data[0].length; col++) {
      let total = 0;
      for (let row = 1; row < data.length; row++)
        total += (data[row][col] as number) || 0;
      totalRow.push(total);
    }
    data.push(totalRow);
  }

  console.info(url, "Finished loading");

  return data;
};

/**
 * keep as much computation in this function as possible. could split into more
 * functions/web workers, but every time you communicate with a web worker,
 * the content must be serialized/deserialized, which takes a long time with
 * lots of data.
 */

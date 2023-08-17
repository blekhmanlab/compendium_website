import { execSync } from "child_process";
import { createReadStream, readFileSync, writeFileSync } from "fs";
import readline from "readline";
import { parse as parseHTML } from "node-html-parser";
import Downloader from "nodejs-file-downloader";
import { LD } from "./ld";

const lastCall: { [key: string]: number } = {};
/** return true only if enough time has passed since last call */
export const throttle = (key: string, interval = 1000) => {
  if (!lastCall[key] || performance.now() > lastCall[key] + interval) {
    lastCall[key] = performance.now();
    return true;
  } else return false;
};

/** fetch json or text */
export const request = async <Type>(
  url: string,
  type: "json" | "text" = "json",
) => {
  const options: RequestInit = { redirect: "follow" };
  const response = await fetch(url, options);
  if (!response.ok) throw Error("Response not OK");
  if (type === "text") return (await response.text()) as Type;
  else return (await response.json()) as Type;
};

/** download file */
export const download = async (url: string) => {
  const filename = url.split("/").pop() || "";
  console.info(`Downloading ${filename}`);
  await new Downloader({
    url,
    fileName: filename,
    cloneFiles: false,
    maxAttempts: 3,
    onProgress: (percentage, _, remainingSize) => {
      if (!throttle("download")) return;
      const percent = Number(percentage).toFixed(1);
      const remaining = (remainingSize / 1024 / 1024).toFixed(1);
      console.info(`${percent}% done, ${remaining}MB left`);
    },
  }).download();
  console.info(`100% done, 0MB left`);
  if (filename?.endsWith(".gz")) execSync("gzip -d -f " + filename);
};

/** load local csv file by stream */
/** https://stackoverflow.com/questions/63749853/possible-to-make-an-event-handler-wait-until-async-promise-based-code-is-done */
export async function* stream(
  url: string,
): AsyncGenerator<string[], undefined> {
  const readInterface = readline.createInterface({
    input: createReadStream(url),
  });
  const delimiter = url.endsWith(".tsv") ? "\t" : ",";
  for await (const line of readInterface) {
    const row = line.split(delimiter);
    if (row.length) yield row;
    else return;
  }
}

/** read local json file */
export const read = <Type>(filename: string) =>
  JSON.parse(readFileSync(filename, "utf-8")) as Type;

/** write local json file */
export const write = (filename: string, data: unknown, pretty = false) =>
  writeFileSync(
    filename,
    JSON.stringify(data, null, pretty ? 2 : undefined),
    "utf8",
  );

/** scrape JSON-LD from url */
export const getLd = async (url: string): Promise<LD> => {
  const response = await request<string>(url, "text");
  const json =
    parseHTML(response).querySelector("script[type='application/ld+json']")
      ?.innerText || "-";
  return JSON.parse(json);
};

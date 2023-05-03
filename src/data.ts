import { parse } from "papaparse";

export const getData = async (url: string) => {
  console.info("fetching", url);
  const response = await fetch(url);
  if (!response.ok) throw Error("Response not OK");

  // response.text() would exceed browser limit for string variables
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length#description
  // instead, parse in chunks

  console.info("parsing as blob");
  let blob: Blob;
  try {
    blob = await response.blob();
  } catch (error) {
    throw Error("Couldn't parse response");
  }

  const chunk = 256 * 1024 * 1024;
  const size = blob.size;
  const textChunks = [];
  let fragment = "";
  for (let start = 0; start < size; start += chunk) {
    let textChunk = fragment + (await blob.slice(start, start + chunk).text());
    const lastNewline = textChunk.lastIndexOf("\n");
    if (lastNewline !== -1) {
      fragment = textChunk.slice(lastNewline + 1);
      textChunk = textChunk.slice(0, lastNewline + 1);
    } else fragment = "";
    textChunks.push(textChunk);
  }
  textChunks[textChunks.length - 1] += fragment;

  console.info("parsing as csv/tsv");
  const delimiter = url.includes("tsv") ? "\t" : ",";
  let data: unknown[] = [];
  for (const textChunk of textChunks) {
    const parsed = await parse(textChunk.trim(), { delimiter });
    data = data.concat(parsed.data);
  }
  return data;
};

import { parse } from "papaparse";

/** fetch file and parse as csv */
export const getData = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw Error("Response not OK");
  const text = await response.text();
  const { data } = await parse(text);
  return data;
};

// usage:
// const instance = new ComlinkWorker(new URL("./data/data.ts", import.meta.url));
// await instance.getData("./class.csv");

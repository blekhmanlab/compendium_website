import { parse } from "papaparse";

/** fetch file and parse as csv */
export const getData = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw Error("Response not OK");
  const text = await response.text();
  const { data } = await parse(text);
  return data;
};

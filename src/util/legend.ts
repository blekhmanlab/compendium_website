import { getCssVariable } from "@/util/dom";

type Entry = {
  /** symbol color */
  color?: string;
  /** symbol (echarts) shape */
  shape?: string;
};

/** list of legend entries */
const getList = (): Entry[] => [
  { color: getCssVariable("--color-red-500"), shape: "triangle" },
  { color: getCssVariable("--color-orange-500"), shape: "diamond" },
  { color: getCssVariable("--color-amber-500"), shape: "circle" },
  { color: getCssVariable("--color-yellow-500"), shape: "rect" },
  { color: getCssVariable("--color-lime-500"), shape: "triangle" },
  { color: getCssVariable("--color-green-500"), shape: "diamond" },
  { color: getCssVariable("--color-emerald-500"), shape: "circle" },
  { color: getCssVariable("--color-teal-500"), shape: "rect" },
  { color: getCssVariable("--color-cyan-500"), shape: "triangle" },
  { color: getCssVariable("--color-sky-500"), shape: "diamond" },
  { color: getCssVariable("--color-blue-500"), shape: "circle" },
  { color: getCssVariable("--color-indigo-500"), shape: "circle" },
  { color: getCssVariable("--color-violet-500"), shape: "rect" },
  { color: getCssVariable("--color-purple-500"), shape: "triangle" },
  { color: getCssVariable("--color-fuchsia-500"), shape: "diamond" },
  { color: getCssVariable("--color-pink-500"), shape: "circle" },
  { color: getCssVariable("--color-rose-500"), shape: "rect" },
];

/** re-create built-in echarts shapes */
export const shapePaths: Record<string, string> = {
  circle: "M -1 0 A 1 1 0 1 0 1 0 A 1 1 0 1 0 -1 0 Z",
  rect: "M -1 -1 L 1 -1 L 1 1 L -1 1 Z",
  triangle: "M 0 -1 L 1 1 L -1 1 Z",
  diamond: "M 0 -1 L 1 0 L 0 1 L -1 0 Z",
};

const getNeutral = (): Entry => ({
  color: getCssVariable("--color-slate-500"),
  shape: "circle",
});

export const useLegend = () => {
  /** map unique key to entry in list */
  const map: Record<string, Entry> = {};

  /** next entry to assign */
  let index = 0;

  /** list of entries to assign */
  const list = getList();

  /** get entry for unique key */
  const entry = (key: string) => {
    /** return existing value */
    if (key in map) return map[key]!;
    if (!key)
      /** assign neutral entry if key is falsy */
      return (map[key] = getNeutral());
    else {
      /** assign next entry in list */
      return (map[key] =
        list[(index++ * 3 + 11) % list.length] ?? getNeutral());
    }
  };

  return [entry, map] as const;
};

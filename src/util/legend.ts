import { getCssVariable } from "@/util/dom";

type Entry = {
  color: string;
};

const getList = (): Entry[] => [
  { color: getCssVariable("--color-fuchsia-500") },
  { color: getCssVariable("--color-red-500") },
  { color: getCssVariable("--color-orange-500") },
  { color: getCssVariable("--color-amber-500") },
  { color: getCssVariable("--color-yellow-500") },
  { color: getCssVariable("--color-lime-500") },
  { color: getCssVariable("--color-green-500") },
  { color: getCssVariable("--color-emerald-500") },
  { color: getCssVariable("--color-teal-500") },
  { color: getCssVariable("--color-cyan-500") },
  { color: getCssVariable("--color-sky-500") },
  { color: getCssVariable("--color-blue-500") },
  { color: getCssVariable("--color-indigo-500") },
  { color: getCssVariable("--color-violet-500") },
  { color: getCssVariable("--color-purple-500") },
  { color: getCssVariable("--color-pink-500") },
  { color: getCssVariable("--color-rose-500") },
];

const getNeutral = (): Entry => ({
  color: getCssVariable("--color-slate-500"),
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
    else
      /** assign next entry in list */
      return (map[key] = list[index++ % list.length] ?? getNeutral());
  };

  return [entry, map] as const;
};

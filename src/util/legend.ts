import { useRef } from "react";
import { formatHex } from "culori";
import { getCssVariable } from "@/util/dom";

const colors = [
  formatHex("oklch(65% 0.3 340)"),
  formatHex("oklch(65% 0.3 300)"),
  formatHex("oklch(65% 0.3 260)"),
  formatHex("oklch(65% 0.3 220)"),
  formatHex("oklch(65% 0.3 180)"),
  formatHex("oklch(70% 0.3 140)"),
  formatHex("oklch(80% 0.3 100)"),
  formatHex("oklch(70% 0.3 60)"),
  formatHex("oklch(65% 0.3 20)"),
];

const gray = getCssVariable("--color-light-gray");

/** re-create built-in echarts shapes */
export const shapePaths: Record<string, string> = {
  circle: "M -1 0 A 1 1 0 1 0 1 0 A 1 1 0 1 0 -1 0 Z",
  rect: "M -0.85 -0.85 L 0.85 -0.85 L 0.85 0.85 L -0.85 0.85 Z",
  triangle: "M 0 -0.85 L 1 0.85 L -1 0.85 Z",
  diamond: "M 0 -1 L 1 0 L 0 1 L -1 0 Z",
};

const shapes = Object.keys(shapePaths);

type Entry = { color: string; shape: string };
type Legend = Record<string, Entry>;
const neutral: Entry = { color: gray, shape: "circle" };

export const useLegend = (keys: string[]) => {
  /** map of key to entry */
  const map: Legend = {};
  const used: Legend = {};

  /** next entry to reserve */
  let color = 0;
  let shape = 0;

  /** reserve entry for each key */
  for (const key of keys)
    if (!map[key])
      map[key] = {
        color: colors[color++ % colors.length]!,
        shape: shapes[shape++ % shapes.length]!,
      };

  /** get entry for key */
  const entry = (key: string) => {
    /** get entry */
    const entry = map[key] ?? neutral;
    /** mark as used */
    used[key] = entry;
    /** sort used by key order, in place */
    for (const key of keys) {
      if (!used[key]) continue;
      const value = used[key]!;
      delete used[key];
      used[key] = value;
    }
    return entry;
  };

  return [entry, used] as const;
};

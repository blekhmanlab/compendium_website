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

const neutral = getCssVariable("--color-gray");

/** re-create built-in echarts shapes */
export const shapePaths: Record<string, string> = {
  circle: "M -1 0 A 1 1 0 1 0 1 0 A 1 1 0 1 0 -1 0 Z",
  rect: "M -0.85 -0.85 L 0.85 -0.85 L 0.85 0.85 L -0.85 0.85 Z",
  triangle: "M 0 -0.85 L 1 0.85 L -1 0.85 Z",
  diamond: "M 0 -1 L 1 0 L 0 1 L -1 0 Z",
};

const shapes = Object.keys(shapePaths);

export const useLegend = (stagger = 1) => {
  /** map unique key to entry in list */
  const map: Record<string, { color: string; shape: string }> = {};

  /** next entry to assign */
  let color = 0;
  let shape = 0;

  /** get entry for unique key */
  const entry = (key: string) => {
    /** return existing value */
    if (key in map) return map[key]!;
    if (!key)
      /** assign neutral entry if key is falsy */
      return (map[key] = { color: neutral, shape: "circle" });
    else {
      /** assign next entry in list */
      return (map[key] = {
        color: colors[(color++ * stagger) % colors.length] ?? neutral,
        shape: shapes[shape++ % shapes.length] ?? "circle",
      });
    }
  };

  return [entry, map] as const;
};

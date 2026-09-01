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

type Entry = { key: string; color: string; shape: string };
type Legend = Entry[];
const neutral: Entry = { key: "", color: gray, shape: "circle" };

export const useLegend = () => {
  /** reserved map of key to entry */
  const reserved = useRef<Legend>([]);
  /** visible map of key to entry */
  const visible: Legend = [];

  /** next entry to reserve */
  const color = useRef(0);
  const shape = useRef(0);

  /** find entry by key */
  const find = (legend: Legend, key: string) => {
    const index = legend.findIndex((entry) => entry.key === key);
    if (index !== -1) return { index, entry: legend[index]! };
  };

  /** keep neutral entry at end */
  const sort = () => {
    const match = find(visible, neutral.key);
    if (match) {
      visible.splice(match.index, 1);
      visible.push(neutral);
    }
  };

  /** get entry for unique key */
  const entry = (key: string) => {
    /** return existing entry */
    const existing = find(reserved.current, key);
    if (existing) {
      if (!find(visible, key)) {
        visible.push(existing.entry);
        sort();
      }
      return existing.entry;
    }

    const newEntry = !key
      ? /** assign neutral entry if key is falsy */
        neutral
      : /** assign next entry in list */
        {
          key,
          color: colors[color.current++ % colors.length] ?? neutral.color,
          shape: shapes[shape.current++ % shapes.length] ?? "circle",
        };

    /** set entry */
    visible.push(newEntry);
    sort();
    reserved.current.push(newEntry);

    return newEntry;
  };

  /** reset reserved map */
  const reset = () => {
    reserved.current = [];
    color.current = 0;
    shape.current = 0;
  };

  return [entry, visible, reset] as const;
};

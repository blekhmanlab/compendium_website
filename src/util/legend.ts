import { formatHex } from "culori";
import { getCssVariable } from "@/util/dom";
import { cos, sin } from "@/util/math";

/** color options */
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

/** neutral color */
const gray = getCssVariable("--color-light-gray");

export type Point = { x: number; y: number };

/** make regular polygon or star */
const makePolygon = (sides: number, starInset = 1, radius = 1, rotate = 0) =>
  Array(sides)
    .fill(null)
    .map((_, index) => {
      const angle = -90 + 360 * (index / sides) + rotate;
      /** https://www.jdawiseman.com/papers/easymath/surds_star_inner_radius.html */
      const scale = index % 2 === 0 ? 1 : starInset;
      return { x: cos(angle) * radius * scale, y: sin(angle) * radius * scale };
    })
    .flat();

/** shape options */
const shapes = [
  /** circle */
  makePolygon(50),
  /** square */
  makePolygon(4, 1, 1.1, 45),
  /** diamond */
  makePolygon(4),
  /** triangle */
  makePolygon(3, 1, 1.1),
  /** pentagon */
  makePolygon(5),
  /** hexagon */
  makePolygon(6, 1, 1, 30),
  /** four point star */
  makePolygon(8, 0.35, 1.1),
  /** five point star */
  makePolygon(10, 0.382, 1.1),
  /** rhombus */
  [
    { x: -0.5, y: -0.75 },
    { x: 1, y: -0.75 },
    { x: 0.5, y: 0.75 },
    { x: -1, y: 0.75 },
  ],
].map((points) =>
  points
    .map(({ x, y }, index) => [index === 0 ? "M" : "L", x, y].join(" "))
    .join(" "),
);

type Entry = { color: string; shape: string };
type Legend = Record<string, Entry>;
const neutral: Entry = { color: gray, shape: "circle" };

export const useLegend = (keys: string[], stagger = 1) => {
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
        color: colors[(color++ * stagger) % colors.length]!,
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

export type Point = { x: number; y: number };

/** euclidean distance */
export const dist = (a: Point, b: Point) =>
  Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

/** keep val between upper/lower limit */
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

/** generate random point between -1 -> 1, with bias away from 0 */
export const randU = () =>
  Math.pow(Math.random(), 0.5) * (Math.random() > 0.5 ? 1 : -1);

/** trig sin in degrees */
export const sin = (degrees: number) => Math.sin((2 * Math.PI * degrees) / 360);
/** trig cos in degrees */
export const cos = (degrees: number) => Math.cos((2 * Math.PI * degrees) / 360);

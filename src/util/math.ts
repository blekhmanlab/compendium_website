export type Point = { x: number; y: number };

/** trig sin in degrees */
export const sin = (degrees: number) => Math.sin((2 * Math.PI * degrees) / 360);
/** trig cos in degrees */
export const cos = (degrees: number) => Math.cos((2 * Math.PI * degrees) / 360);

/** distance */
export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

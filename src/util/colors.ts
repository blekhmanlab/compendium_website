/** palette of colors */
const colors = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#ff9800",
  "#ff5722",
];

/** map unique string to color */
const colorMap: Record<string, string> = {};

/** next color to assign */
let colorIndex = 0;

/** get color for unique string. if not defined, assign next color in order. */
export const getColor = (key: string) =>
  (colorMap[key] ??= colors[colorIndex++ % colors.length]!);

/** format number to string */
export const formatNumber = (value?: number, compact = true) =>
  (value || 0).toLocaleString(undefined, {
    notation: compact ? "compact" : undefined,
  });

/** format bytes to string */
export const formatBytes = (value?: number) => {
  value ??= 0;
  value /= 1000 * 1000;
  let unit = "megabyte";
  if (value > 1000) {
    value /= 1000;
    unit = "gigabyte";
  }

  return (value || 0).toLocaleString(undefined, {
    style: "unit",
    unit,
    maximumFractionDigits: 1,
  });
};

/** format date to string */
export const formatDate = (value?: string) =>
  (new Date(value || "") || new Date()).toLocaleString(undefined, {
    dateStyle: "medium",
  });

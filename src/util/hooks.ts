import { Ref, useCallback, useRef } from "react";

/** set fitted view box of svg */
export const useViewBox = (padding = 0): [Ref<SVGSVGElement>, () => void] => {
  /** reference to attach to svg element */
  const svg = useRef<SVGSVGElement>(null);

  /** function to call to set fitted viewbox on svg */
  const setViewBox = useCallback(() => {
    /** if svg not mounted yet (or anymore), exit */
    if (!svg.current) return;

    /** get bbox of content in svg */
    const { x, y, width, height } = svg.current.getBBox();
    /** set view box to bbox, essentially fitting view to content */
    const viewBox = [
      x - padding,
      y - padding,
      width + padding * 2,
      height + padding * 2,
    ]
      .map((v) => Math.round(v))
      .join(" ");

    svg.current.setAttribute("viewBox", viewBox);
  }, [padding]);

  return [svg, setViewBox];
};

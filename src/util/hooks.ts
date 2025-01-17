import type { Ref } from "react";
import { useCallback, useRef } from "react";

/** set fitted view box of svg */
export const useViewBox = (padding = 0): [Ref<SVGSVGElement>, () => void] => {
  /** reference to attach to svg element */
  const svg = useRef<SVGSVGElement>(null);

  /** function to call to set fitted viewbox on svg */
  const setViewBox = useCallback(() => {
    /** if svg not mounted yet (or anymore), exit */
    if (!svg.current) return;

    /** get bbox of content in svg */
    let { x, y, width, height } = svg.current.getBBox();

    /** incorporate padding */
    x -= padding;
    y -= padding;
    width += padding * 2;
    height += padding * 2;

    /** set view box to bbox, essentially fitting view to content */
    const viewBox = [x, y, width, height].map(Math.round).join(" ");

    svg.current.setAttribute("viewBox", viewBox);
  }, [padding]);

  return [svg, setViewBox];
};

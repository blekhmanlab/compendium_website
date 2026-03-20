import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import type { D3ZoomEvent, GeoProjection, ZoomTransform } from "d3";
import type { ByCountry, ByRegion } from "@/pages/home/data/geo";
import { useMemo, useRef, useState } from "react";
import { useEventListener } from "@reactuses/core";
import {
  extent,
  geoGraticule,
  geoNaturalEarth1,
  geoPath,
  interpolateLab,
  scaleLog,
  select,
  zoom,
  zoomIdentity,
} from "d3";
import { clamp } from "lodash";
import Select from "@/components/Select";
import { setSelectedFeature, useData } from "@/pages/home/state";
import { frame } from "@/util/async";
import { getCssVariable } from "@/util/dom";
import { formatNumber } from "@/util/string";

type Feature = (ByRegion | ByCountry)["features"][number];

/** svg dimensions */
const width = 770;
const height = 400;

const byOptions = ["Country", "Region"] as const;
type By = (typeof byOptions)[number];

const Map = () => {
  const ref = useRef<SVGSVGElement>(null);
  const outlineRef = useRef<SVGPathElement>(null);
  const graticulesRef = useRef<SVGPathElement>(null);
  const featuresRef = useRef<(SVGPathElement | null)[]>([]);

  /** get global state */
  const byCountry = useData((state) => state.byCountry);
  const byRegion = useData((state) => state.byRegion);
  const selectedFeature = useData((state) => state.selectedFeature);

  /** local state */
  const [by, setBy] = useState<By>(byOptions[0]);

  /** colors */
  const primary = getCssVariable("--color-primary");
  const secondary = getCssVariable("--color-secondary");
  const gray = getCssVariable("--color-slate-500");
  const darkGray = getCssVariable("--color-slate-700");

  /** unset selected feature when clicking off map */
  useEventListener(
    "click",
    () => document.activeElement === document.body && setSelectedFeature(),
  );

  /** data to show */
  const data = by === "Country" ? byCountry : byRegion;

  /** get range of sample counts */
  const [, max = 1000] = extent(
    data?.features ?? [],
    (datum) => datum.properties.samples,
  );

  /** check if feature/datum is selected */
  const isSelected = (d: Feature) =>
    selectedFeature?.country === ""
      ? selectedFeature?.region === d.properties.region
      : selectedFeature?.country === d.properties.country;

  /** color scale */
  const scale = scaleLog<string>()
    .domain([1, max])
    .range(selectedFeature ? [darkGray, gray] : [gray, primary])
    .interpolate(interpolateLab);

  const { projection, baseScale } = useMemo(() => {
    /** create projection */
    const projection = geoNaturalEarth1();

    fitProjection(projection);

    /** get scale when projection fit to earth bbox */
    const baseScale = projection.scale();

    return { projection, baseScale };
  }, []);

  /** reset projection */
  const resetProjection = () => {
    projection.center([0, 0]);
    projection.rotate([0, 0]);
    projection.scale(baseScale);
  };

  /** path calculator for projection */
  const path = geoPath().projection(projection);

  /** re-draw paths (imperatively) */
  /** (declaratively w/ jsx does full component re-render, too slow) */
  const redraw = () => {
    outlineRef.current?.setAttribute("d", path({ type: "Sphere" }) ?? "");
    graticulesRef.current?.setAttribute("d", path(graticules) ?? "");
    featuresRef.current?.forEach((element, index) => {
      if (!element) return;
      const feature = data?.features[index];
      if (!feature) return;
      element.setAttribute("d", path(feature) ?? "");
    });
  };

  /** keep track of old transform to calculate deltas */
  const oldTransform = useRef<ZoomTransform>(null);

  /** update map view pan and zoom */
  const onZoom = async (fullEvent: D3ZoomEvent<SVGSVGElement, unknown>) => {
    const { sourceEvent: event, transform } = fullEvent || {};

    /** get current projection components */
    let [x, y] = projection.center();
    let scale = projection.scale();
    let [lambda, phi] = projection.rotate();

    /** update components based on event transform */
    if (event && transform && oldTransform.current) {
      /** calculate deltas */
      const dx = transform.x - oldTransform.current.x;
      const dy = transform.y - oldTransform.current.y;
      const dk = transform.k - oldTransform.current.k;

      /** zoom event */
      if (dk) {
        /** set new zoom */
        scale = transform.k;

        /** original coords of pointer */
        const oldPointer = getPointer(ref.current, projection, event);

        /** apply zoom */
        projection.scale(scale);

        /**
         * iteratively pan map under pointer such that new pointer coords
         * approach original
         */
        for (let iterations = 0; iterations < 3; iterations++) {
          /** new coords of pointer */
          const newPointer = getPointer(ref.current, projection, event);

          /** set new pan */
          lambda += newPointer.x - oldPointer.x;
          y += newPointer.y - oldPointer.y;

          /** apply pan */
          projection.rotate([lambda, phi]);
          projection.center([x, y]);
        }
      } else {
        /** pan event */

        /** set new pan */
        lambda += (baseScale / scale / 2) * dx;
        y += (baseScale / scale / 2) * dy;
      }
    }

    /** store old transform */
    if (transform) oldTransform.current = transform;

    /** limit pan */
    const yLimit = 0.89 * (90 - 90 * (baseScale / scale));
    y = clamp(y, -yLimit, yLimit);
    if (lambda < -180) lambda += 360;
    if (lambda > 180) lambda -= 360;

    /** apply pan */
    projection.rotate([lambda, phi]);
    projection.center([x, y]);

    /** make dragging smoother */
    await frame();
    redraw();
  };

  /** zoom handler */
  const zoomBehavior = zoom<SVGSVGElement, unknown>()
    // eslint-disable-next-line
    .on("zoom", onZoom)
    .scaleExtent([baseScale, baseScale * 10]);

  if (!byCountry || !byRegion)
    return <div className="placeholder">Loading map</div>;

  return (
    <div className="flex flex-col items-center gap-4">
      <Select
        label="Group by:"
        value={by}
        onChange={setBy}
        options={byOptions}
      />

      <svg
        ref={(element) => {
          ref.current = element;
          if (!element) return;

          /** get d3 selection */
          const selection = select(element);
          if (!selection) return;

          /** attach zoom behavior */
          zoomBehavior(selection);

          redraw();

          selection
            /** always prevent scroll on wheel, not just when at scale limit */
            .on("wheel", (event) => event.preventDefault())
            /** reset zoom */
            .on("dblclick.zoom", () => {
              zoomBehavior.transform(selection, zoomIdentity.scale(baseScale));
              resetProjection();
              redraw();
            });
        }}
        viewBox={[0, 0, width, height].join(" ")}
        className="w-full stroke-[0.5]"
      >
        <g className="fill-none stroke-slate-500/50">
          <path ref={outlineRef} />
          <path ref={graticulesRef} />
        </g>
        <g>
          {data?.features.map((feature, index) => (
            <path
              ref={(element) => {
                featuresRef.current[index] = element;
              }}
              key={index}
              fill={
                isSelected(feature)
                  ? secondary
                  : scale(feature.properties.samples || 1)
              }
              className="
                cursor-pointer stroke-black transition
                hover:fill-white
                focus:fill-white
                [:not(:focus-visible)]:outline-none
              "
              role="graphics-symbol"
              tabIndex={0}
              onClick={(event) => selectFeature(event, feature)}
              onKeyDown={(event) => selectFeature(event, feature)}
              data-tooltip={tooltipTable({
                Country: feature.properties.country
                  ? `${feature.properties.country} (${feature.properties.code})`
                  : undefined,
                Region: feature.properties.region,
                Samples: formatNumber(feature.properties.samples, false),
              })}
            />
          ))}
        </g>
      </svg>

      <div className="flex w-full items-center justify-center gap-4 wrap-anywhere">
        <span className="text-right">Fewer Samples</span>
        <span
          className="h-3 w-24"
          style={{
            background: `linear-gradient(to right, ${scale(1)}, ${scale(max)})`,
          }}
        ></span>
        <span>More Samples</span>
      </div>
    </div>
  );
};

export default Map;

/** fit projection to bbox of earth */
const fitProjection = (projection: GeoProjection) =>
  projection.fitSize([width, height], {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-180, -90],
          [180, -90],
          [180, 90],
          [-180, 90],
        ],
      ],
    },
  });

/** long/lat lines */
const graticules = geoGraticule().step([20, 20])() ?? "";

/** get pointer position in projection coordinates */
const getPointer = (
  svg: SVGSVGElement | null,
  projection: GeoProjection,
  event: PointerEvent | WheelEvent | TouchEvent,
) => {
  /** point in screen coords */
  const screenPoint = new DOMPoint(0, 0);

  /** mouse */
  if ("clientX" in event) {
    screenPoint.x = event.clientX;
    screenPoint.y = event.clientY;
  }

  /** touch(es) */
  if ("touches" in event) {
    if (event.touches.length === 1) {
      screenPoint.x = event.touches[0]!.clientX;
      screenPoint.y = event.touches[0]!.clientY;
    }
    if (event.touches.length === 2) {
      screenPoint.x =
        (event.touches[0]!.clientX + event.touches[1]!.clientX) / 2;
      screenPoint.y =
        (event.touches[0]!.clientY + event.touches[1]!.clientY) / 2;
    }
  }

  /** point in svg coords */
  const svgPoint = screenPoint.matrixTransform(svg?.getScreenCTM()?.inverse());

  /** point in map coords */
  const mapPoint = projection.invert?.([svgPoint.x, svgPoint.y]) || [];

  return { x: mapPoint[0] || 0, y: -(mapPoint[1] || 0) };
};

/** select country or region on pointer or key click */
const selectFeature = (
  event: MouseEvent | PointerEvent | KeyboardEvent,
  d: Feature,
) => {
  const feature = d.properties;
  /** key press */
  if ("key" in event) {
    if (event.key === "Enter") setSelectedFeature(feature);
    if (event.key === "Escape") setSelectedFeature();
  } else {
    /** pointer click */
    setSelectedFeature(feature);
    event.stopPropagation();
  }
};

/** generate tooltip table from entries */
export const tooltipTable = (entries: Record<string, unknown>) =>
  [
    "<dl>",
    ...Object.entries(entries).flatMap(([key, value]) =>
      value === null || value === undefined || value === "" || value === false
        ? []
        : [`<dt>${key}</dt>`, `<dd>${value}</dd>`],
    ),
    "</dl>",
  ].join("\n");

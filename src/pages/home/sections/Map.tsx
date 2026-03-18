import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import type { ByGeo } from "@/pages/home/data";
import { useMemo, useRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { useEventListener } from "@reactuses/core";
import * as d3 from "d3";
import { clamp } from "lodash";
import Placeholder from "@/components/Placeholder";
import Select from "@/components/Select";
import { setSelectedFeature, useData } from "@/pages/home/data";
import { getCssVariable } from "@/util/dom";
import { formatNumber } from "@/util/string";

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
  const primary = getCssVariable("--color-fuchsia-500");
  const secondary = getCssVariable("--color-indigo-500");
  const gray = getCssVariable("--color-slate-500");
  const darkGray = getCssVariable("--color-slate-700");

  /** unset selected feature when clicking off map */
  useEventListener(
    "click",
    () => document.activeElement === document.body && setSelectedFeature(),
  );

  /** data to show */
  const data = by === "Country" ? byCountry : byRegion;

  type Datum = ByGeo["features"][number];

  /** get range of sample counts */
  const [, max = 1000] = d3.extent(
    data?.features ?? [],
    (d) => d.properties.samples,
  );

  /** check if feature/datum is selected */
  const isSelected = (d: Datum) =>
    selectedFeature?.country === ""
      ? selectedFeature?.region === d.properties.region
      : selectedFeature?.country === d.properties.country;

  /** color scale */
  const scale = d3
    .scaleLog<string>()
    .domain([1, max])
    .range(selectedFeature ? [darkGray, gray] : [gray, primary])
    .interpolate(d3.interpolateLab);

  const { projection, baseScale } = useMemo(() => {
    /** create projection */
    const projection = d3.geoNaturalEarth1();

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
  const path = d3.geoPath().projection(projection);

  /** re-draw paths */
  /** declaratively w/ jsx does full component re-render, which is too slow */
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
  const oldTransform = useRef<d3.ZoomTransform>(null);

  /** update map view pan and zoom */
  const onZoom = (fullEvent: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
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

    redraw();
  };

  /** zoom handler */
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    // eslint-disable-next-line
    .on("zoom", onZoom)
    .scaleExtent([baseScale, baseScale * 10]);

  if (!byCountry || !byRegion)
    return <Placeholder className="h-100">Loading map...</Placeholder>;

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
          const selection = d3.select(element);
          if (!selection) return;

          /** attach zoom behavior */
          zoom(selection);

          redraw();

          selection
            /** always prevent scroll on wheel, not just when at scale limit */
            .on("wheel", (event) => event.preventDefault())
            /** reset zoom */
            .on("dblclick.zoom", () => {
              zoom.transform(selection, d3.zoomIdentity.scale(baseScale));
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
              data-tooltip={renderToString(
                <dl>
                  {feature.properties.country && (
                    <>
                      <dt>Country</dt>
                      <dd>
                        {feature.properties.country} ({feature.properties.code})
                      </dd>
                    </>
                  )}
                  <dt>Region</dt>
                  <dd>{feature.properties.region}</dd>
                  <dt>Samples</dt>
                  <dd>{formatNumber(feature.properties.samples, false)}</dd>
                </dl>,
              )}
            />
          ))}
        </g>
      </svg>

      <div className="flex w-full items-center justify-center gap-4 wrap-anywhere">
        <span className="text-right">Fewer Samples</span>
        <span className="h-2 w-24"></span>
        <span>More Samples</span>
      </div>
    </div>
  );
};

export default Map;

/** fit projection to bbox of earth */
const fitProjection = (projection: d3.GeoProjection) =>
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
const graticules = d3.geoGraticule().step([20, 20])() ?? "";

/** get pointer position in projection coordinates */
const getPointer = (
  svg: SVGSVGElement | null,
  projection: d3.GeoProjection,
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
  d: ByGeo["features"][number],
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

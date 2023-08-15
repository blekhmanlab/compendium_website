import { useEffect, useState } from "react";
import * as d3 from "d3";
import { Feature } from "geojson";
import Placeholder from "@/components/Placeholder";
import Select from "@/components/Select";
import { Data, setSelectedFeature, useData } from "@/data";
import { getCssVariable } from "@/util/dom";
import { clamp } from "@/util/math";
import classes from "./Map.module.css";

/** svg dimensions */
const width = 800;
const height = 400;

const byOptions = ["Country", "Region"];
type By = (typeof byOptions)[number];

const Map = ({ id = "map" }) => {
  /** get global state */
  const byCountry = useData((state) => state.byCountry);
  const byRegion = useData((state) => state.byRegion);
  const selectedFeature = useData((state) => state.selectedFeature);

  /** local state */
  const [by, setBy] = useState<By>(byOptions[0]);

  /** rerun d3 code when props change */
  useEffect(() => {
    chart(id, by === "Country" ? byCountry : byRegion, selectedFeature);
  }, [id, byCountry, byRegion, by, selectedFeature]);

  /** show status */
  if (!byCountry || !byRegion) return <Placeholder>Loading map</Placeholder>;

  return (
    <div className="content">
      <Select
        label="Group by:"
        value={by}
        onChange={setBy}
        options={byOptions}
      />

      <svg
        viewBox={[0, 0, width, height].join(" ")}
        id={id}
        className={classes.svg}
      >
        <g className="map-container">
          <g className="outline"></g>
          <g className="graticules"></g>
          <g className="features"></g>
        </g>
      </svg>

      <div className={classes.legend}>
        <span>Less Samples</span>
        <span className={classes.gradient}></span>
        <span>More Samples</span>
      </div>
    </div>
  );
};

export default Map;

/** d3 code */

/** create projection */
const projection = d3.geoNaturalEarth1();

/** fit projection to bbox of earth */
const fitProjection = () =>
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
fitProjection();

/** get mouse position in projection coordinates */
const getMouse = (event: WheelEvent) => {
  const [x = 0, y = 0] = projection.invert?.(d3.pointer(event)) || [];
  return { x, y: -y };
};

/** get scale when projection fit to earth bbox */
const baseScale = projection.scale();

/** path calculator for projection */
const path = d3.geoPath().projection(projection);

const graticules = d3.geoGraticule().step([20, 20])();

const chart = (
  id: string,
  data: Data["byCountry"] | Data["byRegion"],
  selectedFeature: Data["selectedFeature"],
) => {
  if (!data) return;

  const svg = d3.select<SVGSVGElement, unknown>("#" + id);

  /** draw projection outline */
  svg
    .select(".outline")
    .selectAll("." + classes.outline)
    .data([graticules])
    .join("path")
    .attr("class", classes.outline)
    .attr("d", () => path({ type: "Sphere" }));

  /** draw graticules */
  svg
    .select(".graticules")
    .selectAll("." + classes.graticule)
    .data([graticules])
    .join("path")
    .attr("class", classes.graticule)
    .attr("d", path);

  /** get range of sample counts */
  const [, max = 1000] = d3.extent(data.features, (d) => d.properties.samples);

  /** get css variable colors */
  const primary = getCssVariable("--primary");
  const gray = getCssVariable("--gray");
  const secondary = getCssVariable("--secondary");
  const darkGray = getCssVariable("--dark-gray");

  /** color scale */
  const scale = d3
    .scaleLog<string>()
    .domain([1, max])
    .range([gray, primary])
    .interpolate(d3.interpolateLab);

  /** select country or region on mouse or key click */
  const selectFeature = (
    event: PointerEvent | KeyboardEvent,
    d: (typeof data)["features"][number],
  ) => {
    const feature = d.properties;
    /** key press */
    if ("key" in event) {
      if (event.key === "Enter") setSelectedFeature(feature);
      if (event.key === "Escape") setSelectedFeature(undefined);
    } else {
      /** mouse click */
      setSelectedFeature(feature);
      event.stopPropagation();
    }
  };

  /** draw features */
  svg
    .select(".features")
    .selectAll("." + classes.feature)
    .data(data.features)
    .join("path")
    .attr("class", classes.feature)
    .attr("d", path)
    .attr("fill", (d) =>
      !selectedFeature
        ? scale(d.properties.samples || 1)
        : (
            selectedFeature.country
              ? selectedFeature.country === d.properties.country
              : selectedFeature.region === d.properties.region
          )
        ? secondary
        : darkGray,
    )
    .attr(
      "data-tooltip",
      ({ properties: { region, country, code, samples } }) =>
        [
          `<div class="tooltip-table">`,
          region && `<span>Region</span><span>${region || "???"}</span>`,
          (country || code) &&
            `<span>Country</span><span>${country || "???"} (${
              code || "??"
            })</span>`,
          `<span>Samples</span><span>${samples.toLocaleString()}</span>`,
          `</div>`,
        ]
          .filter(Boolean)
          .join(""),
    )
    .on("keydown", selectFeature)
    .on("click", selectFeature);

  /** reset map view */
  const resetView = () => {
    projection.center([0, 0]);
    projection.rotate([0, 0]);
    fitProjection();
  };

  type DragEvent = d3.D3DragEvent<Element, Data, unknown>;

  /** move map view pan and zoom */
  const moveView = (event?: DragEvent | WheelEvent) => {
    /** get current projection components */
    let [x, y] = projection.center();
    let scale = projection.scale();
    let [lambda, phi] = projection.rotate();

    /** update components based on event/transform */
    if (event) {
      if ("deltaY" in event) {
        /** zoom event */

        /** prevent page scroll */
        event.preventDefault();
        /** set new zoom */
        scale = event.deltaY < 0 ? scale * 1.1 : scale / 1.1;
        /** limit zoom */
        scale = clamp(scale, baseScale, baseScale * 10);

        /** original coords of mouse */
        const oldMouse = getMouse(event);

        /** apply zoom */
        projection.scale(scale);

        /**
         * iteratively pan map under mouse such that new mouse coords approach
         * original
         */
        for (let iterations = 0; iterations < 3; iterations++) {
          /** new coords of mouse */
          const newMouse = getMouse(event);

          /** set new pan */
          lambda += newMouse.x - oldMouse.x;
          y += newMouse.y - oldMouse.y;

          /** update pan */
          projection.rotate([lambda, phi]);
          projection.center([x, y]);
        }
      } else {
        /** drag event */

        /** set new pan */
        lambda += (baseScale / 2) * (event.dx / scale);
        y += (baseScale / 2) * (event.dy / scale);
      }
    }

    /** limit pan */
    const angleLimit = 90 - 90 * Math.pow(baseScale / scale, 0.8);
    y = clamp(y, -angleLimit, angleLimit);
    if (lambda < -180) lambda += 360;
    if (lambda > 180) lambda -= 360;

    /** apply pan */
    projection.rotate([lambda, phi]);
    projection.center([x, y]);

    /** update paths based on projection */
    svg
      .selectAll<Element, Feature>("." + classes.outline)
      .attr("d", () => path({ type: "Sphere" }));
    svg.selectAll<Element, Feature>("." + classes.graticule).attr("d", path);
    svg.selectAll<Element, Feature>("." + classes.feature).attr("d", path);
  };

  /** drag handler */
  const drag = d3.drag<SVGSVGElement, unknown, unknown>().on("drag", moveView);

  /** connect drag handler to svg */
  svg.call(drag);

  /** zoom handler */
  svg.on("wheel", (event: WheelEvent) => moveView(event));

  /** double click handler */
  svg.on("dblclick.zoom", () => {
    resetView();
    moveView();
  });

  /** unset selected feature when clicking off map */
  d3.select(window).on("click", () => {
    setSelectedFeature();
  });
};

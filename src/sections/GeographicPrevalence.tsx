import { useEffect, useState } from "react";
import * as d3 from "d3";
import { Feature } from "geojson";
import Placeholder from "@/components/Placeholder";
import Select from "@/components/Select";
import { Data, selectCountry, useData } from "@/data";
import { getCssVariable } from "@/util/dom";
import { clamp } from "@/util/math";
import classes from "./GeographicPrevalence.module.css";

/** svg dimensions */
const width = 800;
const height = 400;

const id = "map";
const title = "By Geography";

const byOptions = ["Country", "Region"];
type By = (typeof byOptions)[number];

const GeographicPrevalence = () => {
  const byCountry = useData((state) => state.byCountry);
  const byRegion = useData((state) => state.byRegion);
  const selectedCountry = useData((state) => state.selectedCountry);

  const [by, setBy] = useState<By>(byOptions[0]);

  /** rerun d3 code when props change */
  useEffect(() => {
    chart(id, by === "Country" ? byCountry : byRegion, selectedCountry);
  }, [byCountry, byRegion, by, selectedCountry]);

  /** show status */
  if (!byCountry || !byRegion)
    return <Placeholder>Loading "{title}" table</Placeholder>;

  return (
    <section>
      <h2>Geographic Prevalence</h2>

      <Select
        label="Group by:"
        value={by}
        onChange={setBy}
        options={byOptions}
      />

      {by === "Region" && (
        <span>
          Countries grouped into regions according to{" "}
          <a
            href="https://unstats.un.org/sdgs/indicators/regional-groups/"
            target="_blank"
          >
            the UN's Sustainable Development Goals
          </a>
        </span>
      )}

      <svg viewBox={[0, 0, width, height].join(" ")} id={id}>
        <g className="map-container" clipPath="url(#map-clip)">
          <g className="graticules"></g>
          <g className="features"></g>
        </g>
        <clipPath id="map-clip">
          <rect x="0" y="0" width={width} height={height} />
        </clipPath>
      </svg>

      <div className={classes.legend}>
        <span>Less Samples</span>
        <span className={classes.gradient}></span>
        <span>More Samples</span>
      </div>
    </section>
  );
};

export default GeographicPrevalence;

/** d3 code */

const graticules = d3.geoGraticule().step([20, 20])();

const chart = (
  id: string,
  data: Data["byCountry"] | Data["byRegion"],
  selectedCountry: Data["selectedCountry"],
) => {
  if (!data) return;

  const svg = d3.select<SVGSVGElement, unknown>("#" + id);

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

  /** get scale when projection fit to earth bbox */
  const baseScale = projection.scale();

  /** path calculator for projection */
  const path = d3.geoPath().projection(projection);

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

  /** draw features */
  svg
    .select(".features")
    .selectAll("." + classes.feature)
    .data(data.features)
    .join("path")
    .attr("class", classes.feature)
    .attr("d", path)
    .attr("fill", (d) =>
      !selectedCountry
        ? scale(d.properties.samples || 1)
        : selectedCountry.code === d.properties.code
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
    .on("click", (event, d) => {
      event.stopPropagation();
      selectCountry({ name: d.properties.country, code: d.properties.code });
    });

  /** reset map view */
  const resetView = () => {
    projection.center([0, 0]);
    projection.rotate([0, 0]);
    fitProjection();
  };

  type DragEvent = d3.D3DragEvent<Element, Data, unknown>;
  type ZoomEvent = d3.D3ZoomEvent<SVGSVGElement, Data>;

  /** move map view pan and zoom */
  const moveView = (event?: DragEvent | ZoomEvent) => {
    /** get current projection components */
    let [x, y] = projection.center();
    let scale = projection.scale();
    let [lambda, phi] = projection.rotate();

    /** update components based on transform */
    if (event) {
      /** zoom event */
      if ("transform" in event) {
        /** get mouse position in geo coordinates */
        // projection.invert?.(d3.pointer(event)) || [];
        scale = event.transform.k;
      } else {
        /** drag event */
        lambda += (baseScale / 2) * (event.dx / scale);
        y += (baseScale / 2) * (event.dy / scale);
      }
    }

    /** limit projection */
    const angleLimit = 90 - 90 * (baseScale / scale);
    y = clamp(y, -angleLimit, angleLimit);
    projection.center([x, y]);

    /** update projection */
    projection.scale(scale);
    projection.rotate([lambda, phi]);
    projection.center([x, y]);

    /** update paths based on projection */
    svg.selectAll<Element, Feature>(".graticule").attr("d", path);
    svg.selectAll<Element, Feature>(".feature").attr("d", path);
  };

  /** drag handler */
  const drag = d3.drag<SVGSVGElement, unknown, unknown>().on("drag", moveView);

  /** connect drag handler to svg */
  svg.call(drag);

  /** zoom handler */
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([baseScale, baseScale * 10])
    .on("zoom", moveView);

  /** connect zoom handler to svg */
  svg
    .call(zoom)
    /** always prevent scroll on wheel, not just when at scale limit */
    .on("wheel", (event) => event.preventDefault());

  /** double click handler */
  svg.on("dblclick.zoom", () => {
    /** reset zoom handler */
    zoom.transform(svg, d3.zoomIdentity);
    resetView();
    moveView();
  });

  d3.select(window).on("click", () => selectCountry());
};

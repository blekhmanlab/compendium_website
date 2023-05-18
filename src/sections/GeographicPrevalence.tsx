import { useEffect } from "react";
import Placeholder from "@/components/Placeholder";
import { Data } from "@/data";
import { clamp } from "@/util/math";
import * as d3 from "d3";
import { Feature } from "geojson";

type Props = {
  id: string;
  title: string;
  world: Data["world"];
  data: Data["countries"];
};

/** svg dimensions */
const width = 800;
const height = 400;

const GeographicPrevalence = ({ id, title, world, data }: Props) => {
  /** rerun d3 code when props change */
  useEffect(() => {
    chart(id, world, data);
  }, [id, world, data]);

  /** show status */
  if (typeof world === "string" || typeof data === "string")
    return (
      <Placeholder>
        "{title}" table
        <br />
        {typeof world === "string" && world}
        {typeof data === "string" && data}
      </Placeholder>
    );

  return (
    <svg viewBox={[0, -60, width, height + 60].join(" ")} id={id}>
      <text
        className="title"
        x={width / 2}
        y={-50}
        textAnchor="middle"
        dominantBaseline="hanging"
      >
        {title}
      </text>
      <g className="map-container" clipPath="url(#map-clip)">
        <g className="graticules"></g>
        <g className="countries"></g>
      </g>
      <clipPath id="map-clip">
        <rect x="0" y="0" width={width} height={height} />
      </clipPath>
    </svg>
  );
};

export default GeographicPrevalence;

/** d3 code */

const graticules = d3.geoGraticule().step([20, 20])();

const chart = (id: string, world: Props["world"], data: Props["data"]) => {
  if (typeof data === "string") return;
  if (typeof world === "string") return;

  const svg = d3.select<SVGSVGElement, unknown>("#" + id);

  /** create projection */
  const projection = d3.geoNaturalEarth1();

  /** reset projection */
  const reset = () => {
    projection.center([0, 0]);
    projection.fitSize([width, height], world);
    projection.rotate([0, 0]);
  };
  reset();

  /** get scale when projection fit to contents */
  const baseScale = projection.scale();

  /** path calculator for projection */
  const path = d3.geoPath().projection(projection);

  /** draw graticules */
  svg
    .select(".graticules")
    .selectAll(".graticule")
    .data([graticules])
    .join("path")
    .attr("class", "graticule")
    .attr("d", path);

  /** get range of sample counts */
  const [min = 0, max = 1000] = d3.extent(data, (d) => d.samples);

  /** color scale */
  const scale = d3
    .scaleLog<string>()
    .domain([min, (min + max) / 2, max])
    .range(["#334155", "#4962f3", "#d239ed"])
    .interpolate(d3.interpolateHcl);

  /** map sample count from countries data to world data features */
  const features = world.features.map((feature) => {
    const properties = feature.properties as { [key: string]: string };
    /** find matching data country */
    const {
      code = "??",
      name = "???",
      samples = 0,
    } = data.find(
      ({ code, name }) =>
        code === properties.ISO_A2.toUpperCase() ||
        name === properties.NAME.toLowerCase()
    ) || {};

    return { ...feature, properties, code, name, samples };
  });

  /** draw features (countries) */
  svg
    .select(".countries")
    .selectAll(".country")
    .data(features)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", (d) => scale(d.samples || min))
    .attr("data-tooltip", ({ properties, samples }) =>
      [
        `<div class="tooltip-table">`,
        `<span>Country</span><span>${properties.NAME} (${properties.ISO_A2})</span>`,
        `<span>Samples</span><span>${samples.toLocaleString()}</span>`,
        `</div>`,
      ].join("")
    );

  /** redraw paths based on projection */
  const redraw = () => {
    svg.selectAll<Element, Feature>(".graticule").attr("d", path);
    svg.selectAll<Element, Feature>(".country").attr("d", path);
  };

  /** mouse drag handler */
  svg.call(
    d3.drag<SVGSVGElement, unknown, unknown>().on("drag", (event) => {
      /** get current projection components */
      let [x, y] = projection.center();
      const scale = projection.scale();
      let [lambda, phi] = projection.rotate();

      /** update components based on drag */
      lambda += ((baseScale / 2) * event.dx) / scale;
      y += ((baseScale / 2) * event.dy) / scale;
      y = clamp(y, -90, 90);

      /** update projection */
      projection.rotate([lambda, phi]);
      projection.center([x, y]);

      redraw();
    })
  );

  /** on mouse double click */
  svg.on("dblclick", () => {
    /** reset projection */
    reset();
    redraw();
  });

  /** on mouse wheel */
  svg.on("wheel", (event: WheelEvent) => {
    /** prevent page scroll */
    event.preventDefault();

    /** zoom in/out */
    let scale = projection.scale();
    if (event.deltaY > 0) scale /= 1.2;
    if (event.deltaY < 0) scale *= 1.2;
    projection.scale(clamp(scale, baseScale, baseScale * 10));
    redraw();
  });
};

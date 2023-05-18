import { useEffect } from "react";
import * as d3 from "d3";
import { features } from "@/assets/world.json";
import { Data } from "@/data";
import { useViewBox } from "@/util/hooks";
import classes from "./Map.module.css";

type Props = {
  id: string;
  title: string;
  countries?: Data["countries"];
};

/** svg dimensions */
const width = 400;
const height = 300;

const Map = ({ id, title, countries }: Props) => {
  const [svg, fit] = useViewBox(20);

  /** rerun d3 code when props change */
  useEffect(() => {
    chart(id);
    fit();
  }, [id, fit]);

  fit();
  chart(id);

  return (
    <svg ref={svg} id={id} className={classes.svg}>
      <text className="title" x={width / 2} y={-50} textAnchor="middle">
        {title}
      </text>
      <g className="map-container"></g>
    </svg>
  );
};

export default Map;

/** d3 code */
const chart = (id: string) => {
  const svg = d3.select<SVGSVGElement, unknown>("#" + id);

  const projection = d3
    .geoNaturalEarth1()
    .scale(200)
    .center([0, 0])
    .rotate([0, 0])
    .translate([width / 2, height]);

  const path = d3.geoPath().projection(projection);

  svg
    .select(".map-container")
    .selectAll(".feature")
    .data(features as d3.GeoPermissibleObjects[])
    .join("path")
    .attr("class", "feature")
    .attr("fill", "gray")
    .attr("d", path)
    .style("stroke", "white");

  const update = () =>
    svg
      .selectAll<Element, d3.GeoPermissibleObjects>(".feature")
      .attr("d", path);

  svg.call(
    d3
      .drag<SVGSVGElement, unknown, unknown>()
      .on("drag", (event: d3.D3DragEvent<SVGSVGElement, unknown, unknown>) => {
        const [lambda, phi] = projection.rotate();
        projection.rotate([lambda + event.dx * 0.5, phi]);
        update();
      })
  );

  svg.on("dblclick", () => {
    projection.rotate([0, 0]);
    update();
  });
};

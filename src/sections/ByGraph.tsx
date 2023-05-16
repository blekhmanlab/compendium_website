import { useEffect } from "react";
import * as d3 from "d3";
import { Data, Table } from "@/data";
import { useViewBox } from "@/util/hooks";
import classes from "./ByGraph.module.css";
import Placeholder from "@/components/Placeholder";

type Props = {
  id: string;
  title: string;
  table?: Data["phyla"] | Data["classes"];
};

/** map colors to phyla */
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
const colorMap: { [phylum: string]: string } = {};
let colorIndex = 0;
const getColor = (phylum: string) =>
  (colorMap[phylum] ??= colors[colorIndex++ % colors.length]);

/** svg key dimensions */
const width = 380;
const bandHeight = width / 15;
const height = (rows: number) => bandHeight * (rows || 10);

const ByGraph = ({ id, title, table }: Props) => {
  const [svg, fit] = useViewBox(20);

  /** rerun d3 code when props change */
  useEffect(() => {
    if (table && typeof table !== "string") chart(id, table);
    fit();
  }, [table, id, fit]);

  if (!Array.isArray(table))
    return (
      <Placeholder className={classes.svg}>
        "{title}" table
        <br />
        {table}
      </Placeholder>
    );

  return (
    <svg ref={svg} id={id} className={classes.svg}>
      <text className={classes.title} x={width / 2} y="-20" textAnchor="middle">
        {title}
      </text>
      <g className={classes.bars}></g>
      <g className={classes.xAxis}></g>
      <g className={classes.yAxis}></g>
      <text x={width / 2} y={height(table.length) + 60} textAnchor="middle">
        # of samples
      </text>
    </svg>
  );
};

export default ByGraph;

/** d3 code */
const chart = (id: string, data: Table) => {
  const svg = d3.select<SVGSVGElement, unknown>("#" + id);

  const [xMin = 0, xMax = 100] = d3.extent(data, (d) => d.samples);

  const xScale = d3
    .scaleLog()
    .domain([Math.max(xMin * 0.9, 0.1), xMax])
    .range([0, width]);

  const yScale = d3
    .scaleBand()
    .domain(data.map((d) => d.fullName))
    .range([0, height(data.length)])
    .padding(0.2);

  const xAxis = d3
    .axisBottom(xScale)
    .ticks(3, (d: number) =>
      d.toLocaleString(undefined, { notation: "compact" })
    );
  const yAxis = d3.axisLeft(yScale).tickFormat((_, i) => data[i].name);

  svg
    .select<SVGGElement>("." + classes.xAxis)
    .attr("transform", `translate(0, ${height(data.length)})`)
    .call(xAxis);

  svg.select<SVGGElement>("." + classes.yAxis).call(yAxis);

  svg
    .select("." + classes.bars)
    .selectAll("." + classes.bar)
    .data(data)
    .join("rect")
    .attr("class", classes.bar)
    .attr("x", "0")
    .attr("y", (d) => yScale(d.fullName) || 0)
    .attr("width", (d) => xScale(d.samples))
    .attr("height", () => yScale.bandwidth())
    .attr("fill", (d) => getColor(d.phylum))
    .attr(
      "data-tooltip",
      ({ kingdom, phylum, _class, samples }) =>
        `
        <div class="tooltip-table">
          <span>Kingdom</span>
          <span>${kingdom}</span>
          <span>Phylum</span>
          <span>${phylum}</span>
          <span>Class</span>
          <span>${_class}</span>
          <span># of Samples</span>
          <span>${samples.toLocaleString()}</span>
        </div>
      `
    );
};

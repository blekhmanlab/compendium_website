import { useEffect } from "react";
import * as d3 from "d3";
import type { CSV } from "@/data";
import { useViewBox } from "@/util/hooks";
import classes from "./ByGraph.module.css";

type Props = {
  id: string;
  title: string;
  table?: CSV;
};

const width = 380;

const ByGraph = ({ id, title, table }: Props) => {
  const [svg, fit] = useViewBox(20);

  /** rerun d3 code when props change */
  useEffect(() => {
    if (table) chart(id, table);
    fit();
  }, [table, id, fit]);

  if (!table) return <></>;

  return (
    <svg ref={svg} id={id} className={classes.svg}>
      <text x={width / 2} y="-10" textAnchor="middle">
        {title}
      </text>
      <g className={classes.bars}></g>
      <g className={classes.xAxis}></g>
      <g className={classes.yAxis}></g>
    </svg>
  );
};

export default ByGraph;

/** d3 code */
const chart = (id: string, table: CSV) => {
  const svg = d3.select<SVGSVGElement, unknown>("#" + id);

  const data = table[0]
    .map((name, index) => ({
      name: name as string,
      total: table[1][index] as number,
    }))
    .slice(1)
    .sort((a, b) => b.total - a.total)
    .slice(0, 20)
    .filter((d) => d.total)
    .map((d) => ({ ...d, name: d.name.split(".").at(-1) as string }));

  const bandHeight = width / 30;
  const height = bandHeight * data.length;

  const [xMin = 0, xMax = 100] = d3.extent(data, (d) => d.total);

  const xScale = d3
    .scaleLog()
    .domain([Math.max(xMin * 0.9, 0.1), xMax])
    .range([0, width]);

  const yScale = d3
    .scaleBand()
    .domain(data.map((d) => d.name))
    .range([0, height])
    .padding(0.2);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  svg
    .select<SVGGElement>("." + classes.xAxis)
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);

  svg.select<SVGGElement>("." + classes.yAxis).call(yAxis);

  svg
    .select("." + classes.bars)
    .selectAll("." + classes.bar)
    .data(data)
    .join("rect")
    .attr("class", classes.bar)
    .attr("x", "0")
    .attr("y", (d) => yScale(d.name) || 0)
    .attr("width", (d) => xScale(d.total))
    .attr("height", () => yScale.bandwidth());
};

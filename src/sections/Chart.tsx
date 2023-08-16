import { useEffect } from "react";
import * as d3 from "d3";
import { startCase } from "lodash";
import Placeholder from "@/components/Placeholder";
import { ByTaxLevel, Data, useData } from "@/data";
import { getColor } from "@/util/colors";
import { useViewBox } from "@/util/hooks";
import classes from "./Chart.module.css";

/** show prevalence of samples at certain taxonomic level as bar chart */

type Props = {
  id?: string;
  data: Data["byClass"] | Data["byPhylum"];
  datumKey:
    | keyof NonNullable<Data["byClass"]>[number]
    | keyof NonNullable<Data["byPhylum"]>[number];
};

/** svg dimensions */
const width = 350;
const bandHeight = width / 10;
const height = (rows: number) => bandHeight * (rows || 10);

/** flag to only fit svg viewbox once */
let fitted = false;

const Chart = ({ id = "chart", data, datumKey }: Props) => {
  /** get global state */
  const selectedFeature = useData((state) => state.selectedFeature);

  /** infer title from key we're accessing on datum */
  const title = "By " + startCase(datumKey);
  /** which sample count to use */
  const sampleKey = (selectedFeature?.code ||
    selectedFeature?.region ||
    "total") as keyof ByTaxLevel[number]["samples"];

  /** filtered data */
  const filtered = data
    ?.sort((a, b) => {
      return (b.samples[sampleKey] || 0) - (a.samples[sampleKey] || 0);
    })
    .slice(0, 20);

  const [svg, fit] = useViewBox(20);

  /** rerun d3 code when props change */
  useEffect(() => {
    chart(id, filtered, datumKey, sampleKey);
  }, [id, filtered, datumKey, sampleKey]);

  /** fit on first mount */
  useEffect(() => {
    if (filtered?.length && !fitted) {
      fit();
      fitted = true;
    }
  }, [filtered, fit]);

  if (!filtered) return <Placeholder>Loading "{title}" table</Placeholder>;

  return (
    <svg ref={svg} id={id} className={classes.chart}>
      <text className="title" x={width / 2} y={-50} textAnchor="middle">
        {title}
      </text>
      <g className="bars"></g>
      <g className="x-axis"></g>
      <g className="y-axis"></g>
      <text
        className="axis-title"
        x={width / 2}
        y={height(filtered?.length || 0) + 80}
        textAnchor="middle"
      >
        Number of samples
      </text>
    </svg>
  );
};

export default Chart;

/** d3 code */
const chart = (
  id: string,
  data: Props["data"],
  datumKey: Props["datumKey"],
  sampleKey: keyof ByTaxLevel[number]["samples"],
) => {
  if (!data) return;

  const svg = d3.select<SVGSVGElement, unknown>("#" + id);

  /** get appropriate sample count */
  const getSamples = (d: (typeof data)[number]) => d.samples[sampleKey] || 0;

  /** get range of sample counts */
  let [xMin = 0, xMax = 100] = d3.extent(data, getSamples);

  /** limit x scale */
  xMin *= 0.9;
  if (xMin < 0.1) xMin = 0.1;
  if (xMax < 100) xMax = 100;

  /** create x scale computer */
  const xScale = d3.scaleLog().domain([xMin, xMax]).range([0, width]);

  /** create y scale computer */
  const yScale = d3
    .scaleBand()
    .domain(data.map((d) => d.kingdom + d.phylum + d._class))
    .range([0, height(data.length)])
    .padding(0.2);

  /** create x axis */
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(3, (d: number) =>
      d.toLocaleString(undefined, { notation: "compact" }),
    );

  /** create y axis */
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((_, i) => String(data[i][datumKey]));

  /** update x axis */
  svg
    .select<SVGGElement>(".x-axis")
    .attr("transform", `translate(0, ${height(data.length)})`)
    .call(xAxis);

  /** update y axis */
  svg.select<SVGGElement>(".y-axis").call(yAxis);

  /** update bars */
  svg
    .select(".bars")
    .selectAll(".bar")
    .data(data)
    .join("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("y", (d) => yScale(d.kingdom + d.phylum + d._class) || 0)
    .attr("width", (d) => xScale(getSamples(d)) || 0)
    .attr("height", () => yScale.bandwidth())
    .attr("fill", (d) => getColor(d.phylum))
    .attr("role", "graphics-symbol")
    .attr("data-tooltip", (d) =>
      [
        `<div class="tooltip-table">`,
        d.kingdom ? `<span>Kingdom</span><span>${d.kingdom}</span>` : "",
        d.phylum ? `<span>Phylum</span><span>${d.phylum}</span>` : "",
        d._class ? `<span>Class</span><span>${d._class}</span>` : "",
        `<span>Samples</span><span>${getSamples(d).toLocaleString()}</span>`,
        `</div>`,
      ]
        .filter(Boolean)
        .join(""),
    );
};

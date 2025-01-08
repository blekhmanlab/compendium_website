import { useEffect } from "react";
import { renderToString } from "react-dom/server";
import * as d3 from "d3";
import Placeholder from "@/components/Placeholder";
import type { ByReads, Data } from "@/data";
import { useData } from "@/data";
import { downloadSvg, getCssVariable } from "@/util/dom";
import { formatNumber } from "@/util/string";

/** show sample counts vs binned read counts */

type Props = {
  id?: string;
  title: string;
  data: Data["byReads"];
};

/** svg dimensions */
const width = 470;
const height = 600;
const padding = 100;

const Histogram = ({ id = "histogram", title, data }: Props) => {
  /** get global state */
  const selectedFeature = useData((state) => state.selectedFeature);

  /** which sample count to use */
  const sampleKey = (selectedFeature?.code ||
    selectedFeature?.region ||
    "total") as keyof ByReads["histogram"][number]["samples"];

  /** rerun d3 code when props change */
  useEffect(() => {
    histogram(id, data, sampleKey);
  }, [id, data, sampleKey]);

  if (!data)
    return <Placeholder height={400}>Loading "{title}" chart...</Placeholder>;

  /** if no samples for any bins */
  const blank = data.histogram.every((bin) => !bin.samples[sampleKey]);

  return (
    <svg
      id={id}
      viewBox={[
        -padding - padding * 0.3,
        -padding,
        width + padding * 2 + padding * 0.3,
        height + padding * 2,
      ].join(" ")}
      className="chart"
      onClick={(event) => {
        if (event.shiftKey)
          downloadSvg(event.currentTarget as Element, "reads-histogram");
      }}
    >
      <text
        className="title"
        x={width / 2}
        y={-padding * 0.9}
        style={{ fontSize: "35px" }}
        textAnchor="middle"
        dominantBaseline="hanging"
      >
        {title}
      </text>
      {selectedFeature && (
        <text
          className="sub-title"
          x={width / 2}
          y={-padding / 2}
          style={{ fontSize: "20px" }}
          textAnchor="middle"
          dominantBaseline="hanging"
        >
          {selectedFeature.country || selectedFeature.region}
        </text>
      )}
      <g className="bars" />
      <line
        className="median-line"
        stroke="currentColor"
        strokeWidth={5}
        y1="0"
        y2={height}
      />
      <text
        className="median-text"
        y="10"
        style={{ fontSize: "30px" }}
        dominantBaseline="hanging"
      />
      <g className="x-axis" transform={`translate(0, ${height})`} />
      <g className="y-axis" />
      <text
        className="axis-title"
        x={0}
        y={0}
        style={{ fontSize: "30px" }}
        textAnchor="middle"
        dominantBaseline="hanging"
        transform={`translate(${-padding * 1.1}, ${height / 2}) rotate(-90)`}
      >
        Samples
      </text>
      <text
        className="axis-title"
        x={width / 2}
        y={height + padding * 0.9}
        style={{ fontSize: "30px" }}
        textAnchor="middle"
      >
        Reads (log)
      </text>
      {blank && (
        <text
          className="axis-title"
          x={width / 2}
          y={height / 2}
          style={{ fontSize: "30px" }}
          textAnchor="middle"
        >
          No Samples
        </text>
      )}
    </svg>
  );
};

export default Histogram;

/** d3 code */
const histogram = (
  id: string,
  data: Props["data"],
  sampleKey: keyof ByReads["histogram"][number]["samples"],
) => {
  if (!data) return;

  type Datum = (typeof data)["histogram"][number];

  const svg = d3.select<SVGSVGElement, unknown>("#" + id);

  /** get appropriate sample count */
  const getSamples = (d: Datum) => d.samples[sampleKey] || 0;

  /** get range of read counts */
  const [xMin = 0, xMax = 10000000] = d3.extent(data.histogram, (d) => d.mid);

  /** get range of sample counts */
  let [yMin = 0, yMax = 100000] = d3.extent(data.histogram, getSamples);
  if (!yMax) yMax = 100;

  /** create x scale computer */
  const xScale = d3.scaleLog().domain([xMin, xMax]).range([0, width]);

  /** create y scale computer */
  const yScale = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);

  /** create x axis */
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(null, (d: number) => formatNumber(d));

  /** create y axis */
  const yAxis = d3
    .axisLeft(yScale)
    .ticks(5)
    .tickFormat((d) => formatNumber(d as number));

  const secondary = getCssVariable("--secondary");

  /** update x axis */
  svg
    .select<SVGGElement>(".x-axis")
    .transition()
    .call(xAxis)
    .selectAll(".tick")
    .attr("font-size", "25px");

  /** update y axis */
  svg
    .select<SVGGElement>(".y-axis")
    .transition()
    .call(yAxis)
    .selectAll(".tick")
    .attr("font-size", "25px");

  /** update bars */
  svg
    .select(".bars")
    .selectAll(".bar")
    .data(data.histogram)
    .join("rect")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d.mid))
    .attr("y", (d) => yScale(getSamples(d)))
    .attr("width", (d) => xScale(d.max) - xScale(d.min) + 1)
    .attr("height", (d) => height - yScale(getSamples(d)))
    .attr("fill", secondary)
    .attr("role", "graphics-symbol")
    .attr("data-tooltip", (d) =>
      renderToString(
        <div className="tooltip-table">
          <span>There are...</span>
          <span>{formatNumber(getSamples(d))} samples</span>
          <span>That have between...</span>
          <span>
            {formatNumber(d.min)} and {formatNumber(d.max)} reads
          </span>
        </div>,
      ),
    );

  /** update median line */
  const median = data.median[sampleKey];
  svg
    .select(".median-line")
    .transition()
    .attr("x1", xScale(median) || 1)
    .attr("x2", xScale(median) || 1);

  /** update median text */
  svg
    .select(".median-text")
    .text("Median: " + formatNumber(median))
    .transition()
    .attr("x", (xScale(median) || 1) + 10);
};

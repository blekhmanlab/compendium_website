import { useEffect } from "react";
import { renderToString } from "react-dom/server";
import * as d3 from "d3";
import { orderBy } from "lodash";
import Placeholder from "@/components/Placeholder";
import { ByTaxLevel, Data, useData } from "@/data";
import { getColor } from "@/util/colors";
import { downloadSvg } from "@/util/dom";
import { formatNumber } from "@/util/math";

/** show prevalence of samples at certain taxonomic level as bar chart */

type Props = {
  id?: string;
  title: string;
  data: Data["byClass"] | Data["byPhylum"];
  datumKey:
    | keyof NonNullable<Data["byClass"]>[number]
    | keyof NonNullable<Data["byPhylum"]>[number];
};

/** svg dimensions */
const width = 300;
const height = 600;
const padding = 100;

const Chart = ({ id = "chart", title, data, datumKey }: Props) => {
  /** get global state */
  const selectedFeature = useData((state) => state.selectedFeature);

  /** which sample count to use */
  const sampleKey = (selectedFeature?.code ||
    selectedFeature?.region ||
    "total") as keyof ByTaxLevel[number]["samples"];

  /** filtered data */
  const filtered =
    data &&
    orderBy(
      data,
      [(d) => d.samples[sampleKey] || 0, "_class", "phylum"],
      ["desc", "asc", "asc"],
    ).slice(0, 20);

  /** rerun d3 code when props change */
  useEffect(() => {
    chart(id, filtered, datumKey, sampleKey);
  }, [id, filtered, datumKey, sampleKey]);

  if (!filtered)
    return <Placeholder height={400}>Loading "{title}" chart...</Placeholder>;

  /** if no samples for first bar, then no samples for any because list sorted */
  const blank = !filtered[0].samples[sampleKey];

  return (
    <svg
      viewBox={[
        -padding - padding * 2,
        -padding,
        width + padding * 2 + padding * 2,
        height + padding * 2,
      ].join(" ")}
      id={id}
      className="chart"
      onClick={(event) => {
        if (event.shiftKey)
          downloadSvg(event.currentTarget as Element, "phyla-chart");
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
      <g className="x-axis" transform={`translate(0, ${height})`} />
      <g className="y-axis" />
      <text
        className="axis-title"
        x={width / 2}
        y={height + padding * 0.9}
        style={{ fontSize: "30px" }}
        textAnchor="middle"
      >
        Samples
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

export default Chart;

/** d3 code */
const chart = (
  id: string,
  data: Props["data"],
  datumKey: Props["datumKey"],
  sampleKey: keyof ByTaxLevel[number]["samples"],
) => {
  if (!data) return;

  type Datum = (typeof data)[number];

  const svg = d3.select<SVGSVGElement, unknown>("#" + id);

  /** get appropriate sample count */
  const getSamples = (d: Datum) => d.samples[sampleKey] || 0;

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
    .range([0, height])
    .padding(0.2);

  /** create x axis */
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(3, (d: number) => formatNumber(d, true));

  /** create y axis */
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((_, i) => String(data[i][datumKey]));

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
    .attr("font-size", "25px");

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
    .attr("height", () => yScale.bandwidth() || 0)
    .attr("fill", (d) => getColor(d.phylum))
    .attr("role", "graphics-symbol")
    .attr("data-tooltip", (d) =>
      renderToString(
        <div className="tooltip-table">
          {d._class && (
            <>
              <span>Class</span>
              <span>{d._class}</span>
            </>
          )}
          <span>Phylum</span>
          <span>{d.phylum}</span>
          <span>Kingdom</span>
          <span>{d.kingdom}</span>
          <span>Samples</span>
          <span>{formatNumber(getSamples(d))}</span>
        </div>,
      ),
    );
};

import { useEffect } from "react";
import * as d3 from "d3";
import Placeholder from "@/components/Placeholder";
import { Data, useData } from "@/data";
import { getColor } from "@/util/colors";
import { useViewBox } from "@/util/hooks";

/** show prevalence of samples at certain taxonomic level as bar graph */

type Props = {
  id: string;
  title: string;
  data: Data["byClass"] | Data["byPhylum"];
  name:
    | keyof NonNullable<Data["byClass"]>[number]
    | keyof NonNullable<Data["byPhylum"]>[number];
};

/** svg dimensions */
const width = 400;
const bandHeight = width / 15;
const height = (rows: number) => bandHeight * (rows || 10);

const TaxonomicChart = ({ id, title, data, name }: Props) => {
  const selectedCountry = useData((state) => state.selectedCountry);

  const [svg, fit] = useViewBox(20);

  const filteredData = (
    data && selectedCountry
      ? data.filter((d) => d.codes.includes(selectedCountry.code || ""))
      : data
  )?.slice(0, 20);

  /** rerun d3 code when props change */
  useEffect(() => {
    chart(id, filteredData, name);
    fit();
  }, [filteredData, selectedCountry, id, fit, name]);

  if (!filteredData) return <Placeholder>Loading "{title}" table</Placeholder>;

  return (
    <svg ref={svg} id={id}>
      <text className="title" x={width / 2} y={-20} textAnchor="middle">
        {title}
      </text>
      <g className="bars"></g>
      <g className="x-axis"></g>
      <g className="y-axis"></g>
      <text
        className="axis-title"
        x={width / 2}
        y={height(filteredData?.length || 0) + 60}
        textAnchor="middle"
      >
        # of samples
      </text>
    </svg>
  );
};

export default TaxonomicChart;

/** d3 code */
const chart = (id: string, data: Props["data"], name: Props["name"]) => {
  if (!data) return;

  const svg = d3.select<SVGSVGElement, unknown>("#" + id);

  /** get range of sample counts */
  const [xMin = 0, xMax = 100] = d3.extent(data, (d) => d.samples);

  /** create x scale computer */
  const xScale = d3
    .scaleLog()
    .domain([Math.max(xMin * 0.9, 0.1), xMax])
    .range([0, width]);

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
  const yAxis = d3.axisLeft(yScale).tickFormat((_, i) => String(data[i][name]));

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
    .attr("width", (d) => xScale(d.samples))
    .attr("height", () => yScale.bandwidth())
    .attr("fill", (d) => getColor(d.phylum))
    .attr("data-tooltip", ({ kingdom, phylum, _class, samples }) =>
      [
        `<div class="tooltip-table">`,
        kingdom ? `<span>Kingdom</span><span>${kingdom}</span>` : "",
        phylum ? `<span>Phylum</span><span>${phylum}</span>` : "",
        _class ? `<span>Class</span><span>${_class}</span>` : "",
        samples
          ? `<span>Samples</span><span>${samples.toLocaleString()}</span>`
          : "",
        `</div>`,
      ]
        .filter(Boolean)
        .join(""),
    );
};

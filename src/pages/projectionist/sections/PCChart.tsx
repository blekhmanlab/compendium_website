import type { EChartsOption } from "echarts";
import { memo } from "react";
import { max, min } from "lodash";
import Chart from "@/components/Chart";

type Props = {
  title: string;
  xLabel: string;
  yLabel: string;
  data: {
    x: number;
    y: number;
    color?: string;
  }[];
};

/** x/y plot of principal components */
const PCChart = ({ title, xLabel, yLabel, data }: Props) => {
  /** separate x/y values */
  const xs = data.map((datum) => datum.x);
  const ys = data.map((datum) => datum.y);

  /** range of coords */
  let xMin = min(xs) ?? 0;
  let xMax = max(xs) ?? 0;
  let yMin = min(ys) ?? 0;
  let yMax = max(ys) ?? 0;

  /** round up/down */
  xMin = Math.floor(xMin);
  xMax = Math.ceil(xMax);
  yMin = Math.floor(yMin);
  yMax = Math.ceil(yMax);

  /** series data */
  const seriesData = data.map((datum) => ({
    name: "",
    value: [datum.x, datum.y],
    itemStyle: { color: datum.color },
    datum,
  }));

  /** scale down point size more points there are */
  const symbolSize = Math.max(1, 10 * 2 ** (-data.length / 200));

  /** echarts options */
  const option: EChartsOption = {
    series: [{ type: "scatter", data: seriesData, symbolSize }],
    grid: { left: 50, right: 50, top: 50, bottom: 50 },
    title: [{ text: title }],
    xAxis: { min: xMin, max: xMax, name: xLabel },
    yAxis: { min: yMin, max: yMax, name: yLabel },
    animation: false,
  };

  if (!data) return <div className="placeholder">Loading phyla</div>;

  return <Chart option={option} init={{ renderer: "canvas" }} />;
};

export default memo(PCChart);

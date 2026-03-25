import type { EChartsOption } from "echarts";
import { memo } from "react";
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
  range: number;
};

/** x/y plot of principal components */
const PCChart = ({ title, xLabel, yLabel, data, range }: Props) => {
  range = Math.ceil(range);

  /** prune points to display to maintain render performance */
  const prune = data.length / 50000;

  /** series data */
  const seriesData = data
    .map((datum) => ({
      name: "",
      value: [datum.x, datum.y],
      itemStyle: { color: datum.color },
      datum,
    }))
    .filter((_, index) => index % prune < 1);

  /** scale down point size more points there are */
  const symbolSize = Math.max(1, 10 * 2 ** (-data.length / 200));

  /** echarts options */
  const option: EChartsOption = {
    series: [{ type: "scatter", data: seriesData, symbolSize }],
    grid: { left: 50, right: 50, top: 50, bottom: 50 },
    title: [{ text: title }],
    xAxis: { min: -range, max: range, name: xLabel },
    yAxis: { min: -range, max: range, name: yLabel },
    animation: false,

    dataZoom: [
      {
        type: "inside",
        xAxisIndex: [0],
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
      },
      {
        type: "inside",
        yAxisIndex: [0],
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
      },
    ],
  };

  if (!data) return <div className="placeholder">Loading phyla</div>;

  return (
    <Chart
      option={option}
      init={{ renderer: "canvas" }}
      className="aspect-square h-[unset]!"
    />
  );
};

export default memo(PCChart);

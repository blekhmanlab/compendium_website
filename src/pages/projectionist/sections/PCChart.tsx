import type { EChartsOption } from "echarts";
import { memo } from "react";
import Chart from "@/components/Chart";
import { tooltipTable } from "@/pages/home/sections/Map";

type Props = {
  title: string;
  subtitle?: string;
  xLabel: string;
  yLabel: string;
  series: {
    color?: string;
    shape?: string;
    data: {
      x: number;
      y: number;
      [key: string]: unknown;
    }[];
  }[];
  range: number;
};

/** x/y plot of principal components */
function PCChart({ title, subtitle, xLabel, yLabel, series, range }: Props) {
  range = Math.ceil(range);

  /** scale down point size more points there are */
  const symbolSizes = series.map((data) =>
    Math.max(1, 10 * 2 ** (-data.data.length / 200)),
  );

  /** echarts options */
  const option: EChartsOption = {
    series: series.map(
      ({ color, shape, data }, index) =>
        ({
          type: "scatter",
          data: data.map(({ x, y, ...datum }) => ({
            name: "",
            value: [x, y],
            tooltip: tooltipTable(datum),
          })),
          itemStyle: { color },
          symbol: shape,
          symbolSize: symbolSizes[index],
          progressive: 0,
          large: true,
          largeThreshold: 10000,
        }) satisfies EChartsOption["series"],
    ),
    grid: { left: 50, right: 50, top: 50, bottom: 50 },
    title: [{ text: title, subtext: subtitle }],
    xAxis: { min: -range, max: range, name: xLabel },
    yAxis: { min: -range, max: range, name: yLabel },

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

    tooltip: { trigger: "item" },
  };

  return (
    <Chart
      option={option}
      init={{ renderer: "canvas" }}
      onZoom={(chart, xScale, yScale) => {
        /** scale points up a bit when zooming in */
        const factor = (xScale * yScale) ** 0.25;
        chart.setOption({
          series: series.map((_, index) => ({
            symbolSize: (symbolSizes[index] ?? 1) * factor,
          })),
        });
      }}
      className="aspect-square w-120"
    />
  );
}

export default memo(PCChart);

import type { EChartsOption } from "echarts";
import { debounce } from "lodash";
import Chart from "@/components/Chart";
import { tooltipTable } from "@/util/string";

type Props = {
  title: string;
  subtitle?: string;
  xLabel: string;
  yLabel: string;
  series: {
    data: {
      x: number;
      y: number;
      [key: string]: unknown;
    }[];
    color?: string;
    shape?: string;
    size?: number;
  }[];
  range: number;
  chunk?: number;
};

/** x/y plot of principal components */
export default function PCChart({
  title,
  subtitle,
  xLabel,
  yLabel,
  series,
  range,
  chunk = 1000,
}: Props) {
  range = Math.ceil(range);

  /** echarts options */
  const option: EChartsOption = {
    series: series.map(
      ({ data, color = "white", shape = "circle", size = 1 }) =>
        ({
          type: "scatter",
          data: data.map(({ x, y, ...datum }) => ({
            name: "",
            value: [x, y],
            tooltip: tooltipTable(datum),
          })),
          itemStyle: { color, opacity: 1 },
          symbol: `path://${shape}`,
          symbolSize: size,
          progressive: chunk,
          progressiveChunkMode: "mod",
        }) satisfies EChartsOption["series"],
    ),
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
      onZoom={debounce((chart, xScale, yScale) => {
        /** scale points up a bit when zooming in */
        const factor = (xScale * yScale) ** 0.15;
        chart.setOption({
          series: series.map((_, index) => ({
            symbolSize: (series[index]?.size ?? 1) * factor,
          })),
        });
      }, 100)}
      className="aspect-square w-120"
      download="pc-chart"
      downloadElement={(element) => element.parentElement ?? element}
    />
  );
}

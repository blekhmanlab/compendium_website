import type { EChartsOption } from "echarts";
import { memo, useMemo } from "react";
import { range as generateRange } from "lodash";
import Chart from "@/components/Chart";

type Props = {
  title: string;
  xLabel: string;
  yLabel: string;
  data: {
    x: number;
    y: number;
  }[];
  range: number;
  binSize?: number;
};

/** x/y plot of principal components */
const HeatmapChart = ({
  title,
  xLabel,
  yLabel,
  data,
  range,
  binSize = 0.5,
}: Props) => {
  range = Math.ceil(range);

  /** unique x values */
  const xs = generateRange(-range, range + binSize, binSize);
  /** unique y values */
  const ys = generateRange(-range, range + binSize, binSize);

  /** split data into 2d bins */
  const binned = useMemo(() => bin2d(data, xs, ys), [data, xs, ys]);

  /** series data */
  const seriesData = useMemo(
    () =>
      binned.map((datum) => ({
        name: "",
        value: [datum.x, datum.y, datum.value],
        datum,
      })),
    [binned],
  );

  /** echarts options */
  const option: EChartsOption = {
    series: [
      {
        type: "heatmap",
        data: seriesData,
      },
    ],
    grid: { left: 50, right: 50, top: 50, bottom: 50 },
    title: [{ text: title }],
    xAxis: {
      type: "category",
      data: xs,
      name: xLabel,
    },
    yAxis: {
      type: "category",
      data: ys,
      name: yLabel,
    },
    visualMap: {
      orient: "horizontal",
      left: "center",
      show: false,
    },
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

  return <Chart option={option} className="aspect-square h-[unset]!" />;
};

export default memo(HeatmapChart);

/** bin 2d points into a grid of cells */
const bin2d = (
  points: { x: number; y: number }[],
  xs: number[],
  ys: number[],
) => {
  const grid: number[][] = Array(ys.length)
    .fill(0)
    .map(() => Array(xs.length).fill(0));
  for (const point of points) {
    const x = xs.findIndex((x) => x > point.x) - 1;
    const y = ys.findIndex((y) => y > point.y) - 1;
    if (x !== -1 && y !== -1) {
      grid[y] ??= [];
      grid[y][x] ??= 0;
      grid[y][x]++;
    }
  }
  return grid.flatMap((row, y) => row.map((value, x) => ({ x, y, value })));
};

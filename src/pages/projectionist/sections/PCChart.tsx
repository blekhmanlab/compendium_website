import type { ECharts, EChartsOption } from "echarts";
import { useEffect, useRef, useState } from "react";
import { init } from "echarts";
import { max, min } from "lodash";
import { sleep } from "@/util/async";
import { getColor } from "@/util/colors";

type Props = {
  title: string;
  xLabel: string;
  yLabel: string;
  data: {
    x: number;
    y: number;
    type?: string;
  }[];
};

/** x/y plot of principal components */
const PCChart = ({ title, xLabel, yLabel, data }: Props) => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const chart = useRef<ECharts>(null);

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
    itemStyle: { color: getColor(datum.type ?? "") },
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
  };

  /** initialize and attach chart */
  useEffect(() => {
    if (!ref) return;
    chart.current = init(ref, "compendium", { renderer: "canvas" });
    sleep().then(() => chart.current?.resize());
    return () => {
      chart.current?.off("finished");
      chart.current?.dispose();
      chart.current = null;
    };
  }, [ref]);

  /** update chart options */
  useEffect(() => {
    if (!chart.current) return;
    chart.current.setOption(option);
  });

  if (!data) return <div className="placeholder">Loading phyla</div>;

  return <div ref={setRef} className="size-full!" />;
};

export default PCChart;

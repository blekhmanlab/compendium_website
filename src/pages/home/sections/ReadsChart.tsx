import type { ECharts, EChartsOption } from "echarts";
import type { ByReads } from "@/pages/home/data/project";
import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { max, min } from "lodash";
import { tooltipTable } from "@/pages/home/sections/Map";
import { useData } from "@/pages/home/state";
import { getCssVariable } from "@/util/dom";
import { formatNumber } from "@/util/string";

type Props = {
  data: ByReads;
};

/** show sample counts vs binned read counts */
const ReadsChart = ({ data }: Props) => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const chart = useRef<ECharts>(null);

  const secondary = getCssVariable("--color-secondary");

  /** get global state */
  const selectedFeature = useData((state) => state.selectedFeature);

  /** which sample count to use */
  const sampleKey = (selectedFeature?.code ||
    selectedFeature?.region ||
    "total") as keyof ByReads["histogram"][number]["samples"];

  type Datum = ByReads["histogram"][number];
  const histogram = data?.histogram || [];

  /** get appropriate sample count */
  const getSamples = (d: Datum) => d.samples[sampleKey] || 0;

  /** axis ranges */
  const xMin = min(histogram.map((bin) => bin.min));
  const xMax = max(histogram.map((bin) => bin.max));
  const yMax = max(histogram.map(getSamples));

  /** series data */
  const seriesData = histogram.map((datum) => ({
    value: [datum.mid, getSamples(datum)],
    datum,
  }));

  /** median value */
  const median = data?.median[sampleKey] ?? 0;

  /** echarts options */
  const option: EChartsOption = {
    series: [
      {
        type: "bar",
        barWidth: "100%",
        data: seriesData,
        itemStyle: {
          color: secondary,
        },
        markLine: {
          symbol: "none",
          silent: true,
          lineStyle: {
            color: "white",
            width: 3,
            type: "solid",
          },
          label: {
            show: true,
            formatter: `Median: ${formatNumber(median)}`,
            position: "insideEndBottom",
            rotate: 0,
            distance: 10,
            color: "white",
            fontSize: "1rem",
            fontFamily: "inherit",
            fontWeight: "normal",
          },
          data: [{ xAxis: median }],
        },
      },
    ],

    title: [
      {
        text: "Reads",
        left: "center",
        top: 0,
        textStyle: {
          color: "white",
          fontSize: "1rem",
          fontFamily: "inherit",
          fontWeight: 600,
        },
      },
      {
        text: selectedFeature
          ? selectedFeature.country || selectedFeature.region
          : "",
        left: "center",
        top: 20,
        textStyle: {
          color: "white",
          fontSize: "0.75rem",
          fontFamily: "inherit",
          fontWeight: "normal",
        },
      },
    ],

    xAxis: {
      type: "log",
      min: xMin,
      max: xMax,
      axisLine: { lineStyle: { color: "#fff2" } },
      axisTick: { lineStyle: { color: "#fff2" } },
      splitLine: { lineStyle: { color: "#fff2" } },
      axisLabel: {
        color: "white",
        fontSize: "1rem",
        fontFamily: "inherit",
        fontWeight: "normal",
        formatter: (value: number) => formatNumber(value),
        hideOverlap: true,
      },
      name: "Reads",
      nameLocation: "middle",
      nameGap: 50,
      nameTextStyle: {
        color: "white",
        fontSize: "1rem",
        fontFamily: "inherit",
        fontWeight: "normal",
      },
    },

    yAxis: {
      type: "value",
      min: 0,
      max: yMax,
      axisLine: { lineStyle: { color: "#fff2" } },
      axisTick: { lineStyle: { color: "#fff2" } },
      splitLine: { lineStyle: { color: "#fff2" } },
      axisLabel: {
        color: "white",
        fontSize: "1rem",
        fontFamily: "inherit",
        fontWeight: "normal",
        formatter: (value: number) => formatNumber(value),
        hideOverlap: true,
      },
      name: "Samples",
      nameLocation: "middle",
      nameGap: 60,
      nameTextStyle: {
        color: "white",
        fontSize: "1rem",
        fontFamily: "inherit",
        fontWeight: "normal",
      },
    },

    tooltip: {
      trigger: "item",
      borderColor: "var(--color-slate-500)",
      backgroundColor: "var(--color-slate-800)",
      textStyle: {
        color: "white",
        fontSize: "inherit",
        fontFamily: "inherit",
        fontWeight: "normal",
      },
      formatter: (params) => {
        /** @ts-expect-error types wrong */
        const datum = params.data.datum as Datum;
        return tooltipTable({
          Samples: formatNumber(getSamples(datum), false),
          Reads: `${formatNumber(datum.min)} to ${formatNumber(datum.max)}`,
        });
      },
      position: function (point, params, dom, rect, size) {
        if (!rect) return point;
        return [
          rect.x + rect.width / 2 - size.contentSize[0] / 2,
          rect.y - size.contentSize[1],
        ];
      },
    },
  };

  /** initialize and attach chart */
  useEffect(() => {
    if (!ref) return;
    chart.current = echarts.init(ref, undefined, { renderer: "svg" });
    chart.current?.on("finished", () => chart.current?.resize());
    return () => {
      chart.current?.dispose();
      chart.current = null;
    };
  }, [ref]);

  /** update chart options */
  useEffect(() => {
    if (!chart.current) return;
    chart.current.setOption(option);
  });

  if (!data) return <div className="placeholder">Loading reads</div>;

  return <div ref={setRef} className="size-full!" />;
};

export default ReadsChart;

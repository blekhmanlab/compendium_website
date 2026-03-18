import type { ECharts, EChartsOption } from "echarts";
import type { ByTaxLevel, Data } from "@/pages/home/data";
import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { orderBy } from "lodash";
import Placeholder from "@/components/Placeholder";
import { useData } from "@/pages/home/data";
import { tooltipTable } from "@/pages/home/sections/Map";
import { getColor } from "@/util/colors";
import { formatNumber } from "@/util/string";

/** show prevalence of samples at certain taxonomic level as bar chart */

type Props = {
  id?: string;
  title: string;
  data: Data["byClass"] | Data["byPhylum"];
  datumKey:
    | keyof NonNullable<Data["byClass"]>[number]
    | keyof NonNullable<Data["byPhylum"]>[number];
};

const Bar = ({ title, data, datumKey }: Props) => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const chart = useRef<ECharts>(null);

  /** get global state */
  const selectedFeature = useData((state) => state.selectedFeature);

  /** which sample count to use */
  const sampleKey = (selectedFeature?.code ||
    selectedFeature?.region ||
    "total") as keyof ByTaxLevel[number]["samples"];

  /** filtered data */
  const filtered = data
    ? orderBy(
        data,
        [(d) => d.samples[sampleKey] || 0, "_class", "phylum"],
        ["desc", "asc", "asc"],
      )
        .slice(0, 20)
        .toReversed()
    : [];

  type Datum = (typeof filtered)[number];

  /** get appropriate sample count */
  const getSamples = (d: Datum) => d.samples[sampleKey] || 0;

  /** get range of sample counts */

  let [xMin = 0, xMax = 100] = [
    Math.min(...filtered.map(getSamples)),
    Math.max(...filtered.map(getSamples)),
  ];

  /** limit x scale */
  xMin *= 0.9;
  if (xMin < 0.1) xMin = 0.1;
  if (xMax < 100) xMax = 100;

  /** series data */
  const seriesData = filtered.map((datum) => ({
    value: getSamples(datum),
    name: String(datum[datumKey] ?? ""),
    itemStyle: {
      color: getColor(datum.phylum),
    },
    datum,
  }));

  const option: EChartsOption = {
    series: [
      {
        type: "bar",
        barWidth: "90%",
        data: seriesData,
      },
    ],

    title: [
      {
        text: title,
        left: "center",
        top: 0,
        textStyle: {
          color: "currentColor",
          fontSize: "1rem",
          fontWeight: 600,
        },
      },
      {
        text: selectedFeature
          ? selectedFeature.country || selectedFeature.region
          : "",
        left: "center",
        top: 24,
        textStyle: {
          color: "currentColor",
          fontSize: "1rem",
          fontWeight: "normal",
        },
      },
    ],

    xAxis: {
      type: "log",
      min: xMin,
      max: xMax,
      splitNumber: 3,
      axisLine: { lineStyle: { color: "currentColor" } },
      axisTick: { lineStyle: { color: "currentColor" } },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
      axisLabel: {
        color: "currentColor",
        fontSize: "1rem",
        fontWeight: "normal",
        formatter: (value: number) => formatNumber(value),
      },
      name: "Samples",
      nameLocation: "middle",
      nameGap: 55,
      nameTextStyle: {
        color: "currentColor",
        fontSize: "1rem",
        fontWeight: "normal",
      },
    },

    yAxis: {
      type: "category",
      data: filtered.map((datum) => String(datum[datumKey] ?? "")),
      axisLine: { lineStyle: { color: "currentColor" } },
      axisTick: { lineStyle: { color: "currentColor" } },
      axisLabel: {
        interval: 0,
        hideOverlap: false,
        color: "currentColor",
        fontSize: "0.75rem",
        fontWeight: "normal",
      },
    },

    tooltip: {
      trigger: "item",
      borderColor: "white",
      backgroundColor: "var(--color-slate-800)",
      textStyle: {
        color: "white",
        fontSize: "inherit",
        fontWeight: "normal",
        fontFamily: "inherit",
      },
      formatter: (params) => {
        /** @ts-expect-error types wrong */
        const datum = params.data.datum;
        return tooltipTable({
          Phylum: datum.phylum,
          Kingdom: datum.kingdom,
          Samples: formatNumber(getSamples(datum), false),
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

  useEffect(() => {
    if (!ref) return;
    chart.current = echarts.init(ref, undefined, { renderer: "svg" });
    return () => {
      chart.current?.dispose();
      chart.current = null;
    };
  }, [ref]);

  useEffect(() => {
    if (!chart.current) return;
    chart.current.setOption(option);
    chart.current?.on("finished", () => chart.current?.resize());
  });

  if (!data)
    return (
      <Placeholder className="h-100">Loading "{title}" chart...</Placeholder>
    );

  return <div ref={setRef} className="size-full!" />;
};

export default Bar;

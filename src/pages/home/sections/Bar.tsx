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

  /** round down/up to nearest power of 10 */
  xMin = 10 ** Math.floor(Math.log10(xMin));
  xMax = 10 ** (Math.ceil(Math.log10(xMax) * 2) / 2);

  /** prevent negative log values */
  if (xMin < 1) xMin = 1;

  /** series data */
  const seriesData = filtered.map((datum) => ({
    name: String(datum[datumKey] ?? ""),
    value: getSamples(datum),
    itemStyle: {
      color: getColor(datum.phylum),
    },
    datum,
  }));

  /** echarts options */
  const option: EChartsOption = {
    series: [
      {
        type: "bar",
        barWidth: "90%",
        data: seriesData,
      },
    ],

    grid: {
      left: 150,
      right: 20,
      top: 50,
      bottom: 50,
    },

    title: [
      {
        text: title,
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
      name: "Samples",
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
      type: "category",
      data: filtered.map((datum) => String(datum[datumKey] ?? "")),
      axisLine: { lineStyle: { color: "#fff2" } },
      axisTick: { lineStyle: { color: "#fff2" } },
      splitLine: { lineStyle: { color: "#fff2" } },
      axisLabel: {
        interval: 0,
        width: 100,
        overflow: "truncate",
        ellipsis: "...",
        align: "right",
        color: "white",
        fontSize: "0.75rem",
        fontFamily: "inherit",
        fontWeight: "normal",
        hideOverlap: false,
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

  if (!data)
    return (
      <Placeholder className="h-100">Loading "{title}" chart...</Placeholder>
    );

  return <div ref={setRef} className="size-full!" />;
};

export default Bar;

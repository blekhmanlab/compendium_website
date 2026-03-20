import type { ECharts, EChartsOption } from "echarts";
import type { ByPhylum } from "@/pages/home/data/taxa";
import { useEffect, useRef, useState } from "react";
import { init } from "echarts";
import { max, min, orderBy } from "lodash";
import { tooltipTable } from "@/pages/home/sections/Map";
import { useData } from "@/pages/home/state";
import { sleep } from "@/util/async";
import { getColor } from "@/util/colors";
import { formatNumber } from "@/util/string";

type Props = {
  data: ByPhylum;
};

/** prevalence of samples at phylum level as bar chart */
const PhylaChart = ({ data }: Props) => {
  type Datum = (typeof data)[number];

  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const chart = useRef<ECharts>(null);

  /** get global state */
  const selectedFeature = useData((state) => state.selectedFeature);

  type Sample = keyof ByPhylum[number]["samples"];

  /** which sample count to use */
  const sampleKey = (selectedFeature?.code ||
    selectedFeature?.region ||
    "total") as Sample;

  /** filtered data */
  const filtered = data
    ? orderBy(
        data,
        [(d: Datum) => d.samples[sampleKey] || 0, "_class", "phylum"],
        ["desc", "asc", "asc"],
      )
        .slice(0, 20)
        .toReversed()
    : [];

  /** get appropriate sample count */
  const getSamples = (d: Datum) => d.samples[sampleKey] || 0;

  /** get range of sample counts */
  let [xMin = 0, xMax = 100] = [
    min(filtered.map(getSamples)),
    max(filtered.map(getSamples)),
  ];

  /** round down/up to nearest power of 10 */
  xMin = 10 ** Math.floor(Math.log10(xMin));
  xMax = 10 ** (Math.ceil(Math.log10(xMax) * 2) / 2);

  /** prevent negative log values */
  if (xMin < 1) xMin = 1;

  /** series data */
  const seriesData = filtered.map((datum) => ({
    name: String(datum.phylum ?? ""),
    value: getSamples(datum),
    itemStyle: {
      color: getColor(datum.phylum),
    },
    datum,
    tooltip: tooltipTable({
      Phylum: datum.phylum,
      Kingdom: datum.kingdom,
      Samples: formatNumber(getSamples(datum), false),
    }),
  }));

  /** echarts options */
  const option: EChartsOption = {
    series: [{ type: "bar", barWidth: "90%", data: seriesData }],

    grid: { left: 150, right: 20, top: 50, bottom: 50 },

    title: [
      {
        text: "Phyla",
        subtext: selectedFeature
          ? selectedFeature.country || selectedFeature.region
          : "",
      },
    ],

    xAxis: {
      name: "Samples",
      type: "log",
      min: xMin,
      max: xMax,
      axisLabel: {
        formatter: (value) => formatNumber(value),
      },
    },

    yAxis: {
      type: "category",
      data: filtered.map((datum) => datum.phylum),
      axisLabel: {
        interval: 0,
        width: 100,
        overflow: "truncate",
        ellipsis: "...",
        fontSize: "0.75rem",
      },
    },

    tooltip: { trigger: "item" },
  };

  /** initialize and attach chart */
  useEffect(() => {
    if (!ref) return;
    chart.current = init(ref, "compendium", { renderer: "svg" });
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

export default PhylaChart;

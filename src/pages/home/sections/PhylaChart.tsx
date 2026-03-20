import type { EChartsOption } from "echarts";
import type { ByPhylum } from "@/pages/home/data/taxa";
import { max, min, orderBy } from "lodash";
import Chart from "@/components/Chart";
import { tooltipTable } from "@/pages/home/sections/Map";
import { useData } from "@/pages/home/state";
import { useLegend } from "@/util/legend";
import { formatNumber } from "@/util/string";

type Props = {
  data: ByPhylum;
};

/** prevalence of samples at phylum level as bar chart */
const PhylaChart = ({ data }: Props) => {
  type Datum = (typeof data)[number];

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

  /** get color for each phylum */
  const [entry] = useLegend();

  /** series data */
  const seriesData = filtered.map((datum) => ({
    name: String(datum.phylum ?? ""),
    value: getSamples(datum),
    itemStyle: {
      color: entry(datum.phylum).color,
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

  if (!data) return <div className="placeholder">Loading phyla</div>;

  return <Chart option={option} />;
};

export default PhylaChart;

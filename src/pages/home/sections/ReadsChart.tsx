import type { EChartsOption } from "echarts";
import type { Reads } from "@/pages/home/data/projects";
import { max, min } from "lodash";
import Chart from "@/components/Chart";
import { tooltipTable } from "@/pages/home/sections/PhylaChart";
import { useData } from "@/pages/home/state";
import { getCssVariable } from "@/util/dom";
import { formatNumber } from "@/util/string";

type Props = {
  data: Reads;
};

/** show sample counts vs binned read counts */
const ReadsChart = ({ data }: Props) => {
  type Datum = Reads["histogram"][number];

  /** colors */
  const secondary = getCssVariable("--color-secondary");

  /** get global state */
  const selectedFeature = useData((state) => state.selectedFeature);

  /** which sample count to use */
  const sampleKey = (selectedFeature?.code ||
    selectedFeature?.region ||
    "total") as keyof Reads["histogram"][number]["samples"];

  const histogram = data?.histogram || [];

  /** get appropriate sample count */
  const getSamples = (d: Datum) => d.samples[sampleKey] || 0;

  /** axis ranges */
  const xMin = min(histogram.map((bin) => bin.min));
  const xMax = max(histogram.map((bin) => bin.max));
  const yMax = max(histogram.map(getSamples));

  /** median value */
  const median = data?.median[sampleKey] ?? 0;

  /** echarts options */
  const option: EChartsOption = {
    series: [
      {
        type: "bar",
        barWidth: "100%",
        data: histogram.map((datum) => ({
          value: [datum.mid, getSamples(datum)],
          tooltip: tooltipTable({
            Samples: formatNumber(getSamples(datum), false),
            Reads: `${formatNumber(datum.min)} to ${formatNumber(datum.max)}`,
          }),
        })),
        itemStyle: {
          color: secondary,
        },
        markLine: {
          label: {
            formatter: `Median: ${formatNumber(median)}`,
          },
          data: [{ xAxis: median }],
        },
      },
    ],

    title: [
      {
        text: "Reads",
        subtext: selectedFeature
          ? selectedFeature.country || selectedFeature.region
          : "",
      },
    ],

    xAxis: {
      name: "Reads",
      type: "log",
      min: xMin,
      max: xMax,
      axisLabel: {
        formatter: (value) => formatNumber(value),
      },
    },

    yAxis: {
      name: "Samples",
      type: "value",
      min: 0,
      max: yMax,
      axisLabel: {
        formatter: (value) => formatNumber(value),
      },
    },

    tooltip: { trigger: "item" },
  };

  if (!data) return <div className="placeholder">Loading reads</div>;

  return <Chart option={option} />;
};

export default ReadsChart;

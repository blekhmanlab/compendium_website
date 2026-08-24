import type { EChartsOption } from "echarts";
import Chart from "@/components/Chart";
import { getCssVariable } from "@/util/dom";
import { formatNumber } from "@/util/string";

type Props = {
  yLabel: string;
  type: "bar" | "line";
  data: Record<string, number>;
};

const maxPcs = 8;

/** scree plots of principal components */
export default function ScreeChart({ yLabel, type, data }: Props) {
  const option: EChartsOption = {
    series: [
      {
        type: type,
        barWidth: "90%",
        color: getCssVariable("--color-primary"),
        data: Object.values(data).map((datum) => ({
          value: datum,
          tooltip: formatNumber(datum, true),
        })),
      },
    ],
    xAxis: {
      name: "PC",
      type: "category",
      data: Object.keys(data)
        .slice(0, maxPcs)
        .map((key) => key.replace("PC", "")),
    },
    yAxis: {
      type: "value",
      name: yLabel,
    },
    tooltip: { trigger: "item" },
  };

  return <Chart option={option} className="h-100" download="scree-chart" />;
}

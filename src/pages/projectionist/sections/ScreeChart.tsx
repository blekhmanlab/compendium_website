import type { EChartsOption } from "echarts";
import Chart from "@/components/Chart";
import { formatNumber } from "@/util/string";

type Props = {
  yLabel: string;
  type: "bar" | "line";
  data: Record<string, number>;
};

const maxPcs = 8;

/** scree plots of principal components */
const ScreeChart = ({ yLabel, type, data }: Props) => {
  const option: EChartsOption = {
    series: [
      {
        type: type,
        barWidth: "90%",
        data: Object.values(data)

          .map((datum) => ({
            value: datum,
            datum,
            tooltip: formatNumber(datum, true),
          })),
      },
    ],
    grid: { left: 50, right: 50, top: 50, bottom: 50 },
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

  return <Chart option={option} className="h-100" />;
};

export default ScreeChart;

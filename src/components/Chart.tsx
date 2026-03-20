import type { ECharts, EChartsInitOpts, EChartsOption } from "echarts";
import { useEffect, useRef, useState } from "react";
import { useResizeObserver } from "@reactuses/core";
import { init } from "echarts";
import { sleep } from "@/util/async";

type Props = {
  option: EChartsOption;
  init?: EChartsInitOpts;
};

/** echarts wrapper */
const Chart = ({ option, init: initOptions = {} }: Props) => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const chart = useRef<ECharts>(null);

  /** initialize and attach chart */
  useEffect(() => {
    if (!ref) return;
    chart.current = init(ref, "compendium", {
      renderer: "svg",
      ...initOptions,
    });
    sleep().then(() => chart.current?.resize());
    return () => {
      chart.current?.dispose();
      chart.current = null;
    };
  }, [ref, initOptions]);

  /** auto-fit */
  useResizeObserver(ref, () => chart.current?.resize());

  /** update chart options */
  useEffect(() => {
    if (!chart.current) return;
    chart.current.setOption(option);
  });

  return <div ref={setRef} className="size-full!" />;
};

export default Chart;

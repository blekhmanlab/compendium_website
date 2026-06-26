import type { ECharts, EChartsInitOpts, EChartsOption } from "echarts";
import { useEffect, useRef, useState } from "react";
import { useDebounceFn, useResizeObserver } from "@reactuses/core";
import clsx from "clsx";
import { connect, init, registerTheme } from "echarts";
import { sleep } from "@/util/async";

type Props = {
  option: EChartsOption;
  init?: EChartsInitOpts;
  onZoom?: (chart: ECharts, xScale: number, yScale: number) => void;
  className?: string;
};

/** echarts wrapper */
export default function Chart({
  option,
  init: initOptions = {},
  onZoom,
  className,
}: Props) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const chart = useRef<ECharts>(null);

  /** initialize and attach chart */
  useEffect(() => {
    if (!ref) return;
    chart.current = init(ref, "compendium", {
      renderer: "svg",
      ...initOptions,
    });
    /** initial resize */
    sleep().then(() => chart.current?.resize());
    /** connect chart zooms together */
    chart.current.group = "group";
    connect("group");
    /** connect listeners */
    if (onZoom)
      chart.current.on("datazoom", (params) => {
        // @ts-expect-error echarts types bad
        if (!params.batch[0]) return;
        // @ts-expect-error echarts types bad
        if (!params.batch[1]) return;
        // @ts-expect-error echarts types bad
        const xScale = 100 / (params.batch[0].end - params.batch[0].start);
        // @ts-expect-error echarts types bad
        const yScale = 100 / (params.batch[1].end - params.batch[1].start);
        if (chart.current) onZoom(chart.current, xScale, yScale);
      });
    return () => {
      chart.current?.dispose();
      chart.current = null;
    };
  }, [ref, initOptions, onZoom]);

  /** auto-fit */
  const resize = useDebounceFn(() => chart.current?.resize(), 300);
  useResizeObserver(ref, resize.run);

  /** update chart options */
  useEffect(() => {
    if (!chart.current) return;
    chart.current.setOption(option);
  });

  return (
    <div
      ref={setRef}
      className={clsx(
        "size-full max-h-screen max-w-full resize overflow-hidden",
        className,
      )}
    />
  );
}

const text = {
  color: "white",
  fontSize: 16 * 1.1,
  fontFamily: "Mona Sans",
  fontWeight: "normal",
};

const textBig = {
  color: "white",
  fontSize: 16 * 1.1,
  fontFamily: "Mona Sans",
  fontWeight: 600,
};

const textSmall = {
  color: "#fffa",
  fontSize: 12 * 1.1,
  fontFamily: "Mona Sans",
  fontWeight: "normal",
};

const lineBig = { color: "white", width: 3, type: "solid" };

const line = { color: "#fff2", width: 1 };

const axis = {
  axisLine: { lineStyle: line },
  axisTick: { lineStyle: line },
  splitLine: { lineStyle: line },
  axisLabel: text,
  nameLocation: "middle",
  nameGap: 50,
  nameTextStyle: text,
};

registerTheme("compendium", {
  animation: false,

  textStyle: text,
  title: {
    top: 0,
    itemGap: 5,
    textStyle: textBig,
    subtextStyle: textSmall,
  },

  categoryAxis: axis,
  valueAxis: axis,
  logAxis: axis,

  bar: {
    itemStyle: {},
  },
  scatter: {
    symbolSize: 1,
    itemStyle: {},
  },

  markLine: {
    symbol: "none",
    silent: true,
    itemStyle: {},
    lineStyle: lineBig,
    label: {
      show: true,
      position: "insideEndBottom",
      rotate: 0,
      distance: 10,
      ...text,
    },
  },

  tooltip: {
    borderColor: "var(--color-slate-500)",
    backgroundColor: "var(--color-slate-800)",
    textStyle: text,
    // eslint-disable-next-line
    formatter: (params: any) => params.data.datum.tooltip,
    // eslint-disable-next-line
    position: (point: any, params: any, dom: any, rect: any, size: any) => {
      if (!rect) return point;
      return [
        rect.x + rect.width / 2 - size.contentSize[0] / 2,
        rect.y - size.contentSize[1],
      ];
    },
  },
});

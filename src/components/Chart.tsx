import type { ECharts, EChartsInitOpts, EChartsOption } from "echarts";
import { useEffect, useId, useRef, useState } from "react";
import { useDebounceFn, useResizeObserver } from "@reactuses/core";
import clsx from "clsx";
import { connect, init, registerTheme } from "echarts";
import { DownloadIcon } from "lucide-react";
import { sleep } from "@/util/async";
import { getCssVariable } from "@/util/dom";

type Props = {
  option: EChartsOption;
  init?: EChartsInitOpts;
  onZoom?: (chart: ECharts, xScale: number, yScale: number) => void;
  className?: string;
  download?: string;
};

/** echarts wrapper */
export default function Chart({
  option,
  init: initOptions = {},
  onZoom,
  className,
  download,
}: Props) {
  const id = useId();
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const chart = useRef<ECharts>(null);

  /** initialize and attach chart */
  useEffect(() => {
    if (!ref) return;
    chart.current = init(ref, "compendium", {
      renderer: "canvas",
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
  const resize = useDebounceFn(() => chart.current?.resize(), 100);
  useResizeObserver(ref, resize.run);

  /** update chart options */
  useEffect(() => {
    if (!chart.current) return;
    chart.current.setOption(option);
  });

  return (
    <>
      <div
        ref={setRef}
        className={clsx(
          "relative size-full max-h-screen max-w-full resize [anchor-name:--chart] [&+button]:opacity-0 [&+button:focus]:opacity-100 [&+button:hover]:opacity-100 [&:hover+button]:opacity-100",
          className,
        )}
        style={{ anchorName: `--${id}` }}
        onDoubleClick={() => chart.current?.dispatchAction({ type: "restore" })}
      />
      <button
        className="absolute top-[anchor(top)] right-[anchor(right)] z-10 size-8 rounded-md hover:bg-gray"
        style={{ positionAnchor: `--${id}` }}
        onClick={() => {
          const src = chart.current?.getDataURL({ type: "png", pixelRatio: 4 });
          if (!src) return;
          const a = document.createElement("a");
          a.href = src;
          a.download = `${download}.png`;
          a.click();
        }}
        aria-label="Download chart"
      >
        <DownloadIcon />
      </button>
    </>
  );
}

/** set default chart styles */
const setTheme = () => {
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

    grid: { left: 50, right: 50, top: 50, bottom: 50 },

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
      emphasis: { itemStyle: { opacity: 0.5 } },
    },
    scatter: {
      symbolSize: 1,
      itemStyle: {},
      emphasis: { itemStyle: { opacity: 0.5 } },
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
      borderColor: getCssVariable("--color-light-gray"),
      backgroundColor: getCssVariable("--color-gray"),
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
};

/** update theme on events that can affect it */
setTheme();
window.addEventListener("load", setTheme);
document.fonts.addEventListener("loadingdone", setTheme);

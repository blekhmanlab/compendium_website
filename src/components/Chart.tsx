import type { ECharts, EChartsInitOpts, EChartsOption } from "echarts";
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { useDebounceFn, useResizeObserver } from "@reactuses/core";
import clsx from "clsx";
import { toCanvas } from "dom-to-image-more";
import { connect, init, registerTheme } from "echarts";
import { DownloadIcon } from "lucide-react";
import { sleep } from "@/util/async";
import { getCssVariable } from "@/util/dom";
import { range, clamp } from "lodash";

type Props = {
  option: EChartsOption;
  init?: EChartsInitOpts;
  onZoom?: (chart: ECharts, xScale: number, yScale: number) => void;
  className?: string;
  download?: string;
  downloadElement?: (element: HTMLElement) => HTMLElement;
};

/** echarts wrapper */
export default function Chart({
  option,
  init: initOptions = {},
  onZoom,
  className,
  download = "chart",
  downloadElement = (element) => element,
}: Props) {
  const id = useId();
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const chart = useRef<ECharts>(null);

  /** get latest values without re-running effect */
  const getInitOptions = useEffectEvent(() => initOptions);
  const getOnZoom = useEffectEvent(
    (chart: ECharts, xScale: number, yScale: number) =>
      onZoom?.(chart, xScale, yScale),
  );

  /** initialize and attach chart */
  useEffect(() => {
    if (!ref) return;
    chart.current = init(ref, "compendium", {
      renderer: "canvas",
      devicePixelRatio: 4,
      ...getInitOptions(),
    });
    /** initial resize */
    sleep().then(() => chart.current?.resize());
    /** connect chart zooms together */
    chart.current.group = "group";
    connect("group");
    /** connect listeners */
    chart.current.on("datazoom", (params) => {
      // @ts-expect-error echarts types bad
      if (!params.batch[0]) return;
      // @ts-expect-error echarts types bad
      if (!params.batch[1]) return;
      // @ts-expect-error echarts types bad
      const xScale = 100 / (params.batch[0].end - params.batch[0].start);
      // @ts-expect-error echarts types bad
      const yScale = 100 / (params.batch[1].end - params.batch[1].start);
      if (chart.current) getOnZoom(chart.current, xScale, yScale);
    });

    return () => {
      chart.current?.dispose();
      chart.current = null;
    };
  }, [ref]);

  /** auto-fit */
  const resize = useDebounceFn(() => chart.current?.resize(), 100);
  useResizeObserver(ref, resize.run);

  /** update chart options */
  useEffect(() => {
    if (!chart.current) return;
    chart.current.setOption(option, true, true);
  });

  return (
    <>
      <div
        ref={setRef}
        className={clsx(
          "relative size-full max-h-screen max-w-full resize overflow-hidden [&+button]:opacity-0 [&+button:focus]:opacity-100 [&+button:hover]:opacity-100 [&:hover+button]:opacity-100",
          className,
        )}
        style={{ anchorName: `--${id}` }}
        onDoubleClick={() => chart.current?.dispatchAction({ type: "restore" })}
      />
      <button
        className="absolute top-[anchor(top)] right-[anchor(right)] z-10 size-8 rounded-md hover:bg-gray"
        style={{ positionAnchor: `--${id}` }}
        onClick={async (event) => {
          if (!ref) return;

          /** disable button */
          event.currentTarget.setAttribute("disabled", "true");

          /** options */
          const scale = 4;
          const padding = 16 * scale;

          /** render */
          const element = downloadElement(ref);
          // eslint-disable-next-line
          ref.style.resize = "none";
          const canvas = await toCanvas(element, { scale });
          ref.style.resize = "";

          /** hide resize handle */

          /** access pixel data */
          let ctx = canvas.getContext("2d")!;
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const getPixel = (x: number, y: number) =>
            pixels.data[(y * canvas.width + x) * 4 + 3];

          /** find crop edge */
          const getEdge = (ys: number[], xs: number[], swap = false) => {
            for (const y of ys)
              for (const x of xs)
                if (swap ? getPixel(y, x) : getPixel(x, y)) return y;
            return 0;
          };

          /** coords */
          const ys = range(0, canvas.height);
          const xs = range(0, canvas.width);

          /** find all crop edges */
          let top = getEdge(ys, xs);
          let bottom = getEdge(ys.toReversed(), xs);
          let left = getEdge(xs, ys, true);
          let right = getEdge(xs.toReversed(), ys, true);

          /** add padding */
          top -= padding;
          bottom += padding;
          left -= padding;
          right += padding;

          /** clamp */
          top = clamp(top, 0, canvas.height / 2);
          bottom = clamp(bottom, canvas.height / 2, canvas.height);
          left = clamp(left, 0, canvas.width / 2);
          right = clamp(right, canvas.width / 2, canvas.width);

          /** calc size */
          const width = right - left + 1;
          const height = bottom - top + 1;

          /** create new cropped canvas */
          const cropped = document.createElement("canvas");
          cropped.width = width;
          cropped.height = height;
          ctx = cropped.getContext("2d")!;

          /** draw cropped image onto new canvas */
          ctx.drawImage(canvas, left, top, width, height, 0, 0, width, height);

          /** download */
          const link = document.createElement("a");
          link.download = download;
          link.href = cropped.toDataURL("image/png");
          link.click();

          /** re-enable button */
          event.currentTarget.removeAttribute("disabled");
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

  const line = { color: "#88888888", width: 1 };

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
    animation: true,

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
      appendTo: "body",
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

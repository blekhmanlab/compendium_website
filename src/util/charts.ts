import { registerTheme } from "echarts";
import { colors } from "@/util/colors";

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
  color: colors,
  textStyle: text,
  title: {
    top: 0,
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

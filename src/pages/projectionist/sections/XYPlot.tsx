import { useRef, type ReactNode } from "react";
import * as d3 from "d3";
import { useElementSize } from "@reactuses/core";
import { fitViewBox } from "@/util/dom";
import classes from "./XYPlot.module.css";

type Props = {
  title?: ReactNode;
  xLabel?: ReactNode;
  yLabel?: ReactNode;
  data: { x: number; y: number; color?: string }[];
};

const XYPlot = ({ title, xLabel, yLabel, data }: Props) => {
  const ref = useRef<SVGSVGElement>(null);

  const [width, height] = useElementSize(ref);
  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);

  const [xMin = 0, xMax = 0] = d3.extent(xs);
  const [yMin = 0, yMax = 0] = d3.extent(ys);

  const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);
  const yScale = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);

  const xAxis = d3.axisBottom(xScale).ticks(5).tickPadding(10);
  const yAxis = d3.axisLeft(yScale).ticks(5).tickPadding(10);

  return (
    <div className={classes.chart}>
      <div className={classes.title}>{title}</div>

      <div className={classes["y-label"]}>{yLabel}</div>

      <svg
        ref={(element) => {
          if (!element) return;
          fitViewBox(element);
        }}
        className={classes["x-axis"]}
      >
        <g
          ref={(element) => {
            if (!element) return;
            const selection = d3.select(element);
            xAxis(selection);
            /** remove interfering d3 axis styles */
            element.removeAttribute("font-size");
            element.removeAttribute("font-family");
          }}
        />
      </svg>

      <div className={classes["x-label"]}>{xLabel}</div>

      <svg
        ref={(element) => {
          if (!element) return;
          fitViewBox(element);
        }}
        className={classes["y-axis"]}
      >
        <g
          ref={(element) => {
            if (!element) return;
            const selection = d3.select(element);
            yAxis(selection);
            /** remove interfering d3 axis styles */
            element.removeAttribute("font-size");
            element.removeAttribute("font-family");
          }}
        />
      </svg>

      <svg
        ref={ref}
        viewBox={[0, 0, width, height].join(" ")}
        className={classes.plot}
      >
        <foreignObject x={0} y={0} width={width} height={height}>
          <canvas
            ref={(element) => {
              if (!element) return;
              const context = element.getContext("2d");
              if (!context) return;
              context.clearRect(0, 0, width, height);
              /** draw data points */
              data.forEach(({ x, y, color = "white" }) => {
                context.fillStyle = color;
                context.beginPath();
                context.arc(xScale(x), yScale(y), 2, 0, 2 * Math.PI);
                context.fill();
              });
            }}
            width={width}
            height={height}
          />
        </foreignObject>
      </svg>
    </div>
  );
};

export default XYPlot;

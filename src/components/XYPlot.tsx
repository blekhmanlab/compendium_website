import * as d3 from "d3";

type Props = {
  xLabel?: string;
  yLabel?: string;
  data: { x: number; y: number }[];
};

/** svg dimensions */
const width = 400;
const height = 400;
const padding = 100;

const XYPlot = ({ xLabel, yLabel, data }: Props) => {
  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);

  const [xMin = 0, xMax = 0] = d3.extent(xs);
  const [yMin = 0, yMax = 0] = d3.extent(ys);

  const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);
  const yScale = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  return (
    <svg viewBox={[0, 0, width, height].join(" ")} className="chart">
      {/* x-axis label */}
      <text
        x={0}
        y={0}
        style={{ fontSize: "30px" }}
        textAnchor="middle"
        dominantBaseline="hanging"
        transform={`translate(${-padding * 1.1}, ${height / 2}) rotate(-90)`}
      >
        {xLabel}
      </text>
      {/* y-axis label */}
      <text
        x={width / 2}
        y={height + padding * 0.9}
        style={{ fontSize: "30px" }}
        textAnchor="middle"
      >
        {yLabel}
      </text>
      {/* x-axis ticks and lines */}
      <g
        ref={(element) => {
          if (!element) return;
          const selection = d3.select(element);
          xAxis(selection);
        }}
        transform={`translate(0, ${height})`}
      />
      {/* y-axis ticks and lines */}
      <g
        ref={(element) => {
          if (!element) return;
          const selection = d3.select(element);
          yAxis(selection);
        }}
      />
      <foreignObject x={0} y={0} width={width} height={height}>
        <canvas
          ref={(element) => {
            if (!element) return;
            const context = element.getContext("2d");
            if (!context) return;
            context.clearRect(0, 0, width, height);
            /** draw data points */
            context.fillStyle = "steelblue";
            data.forEach(({ x, y }) => {
              context.beginPath();
              context.arc(xScale(x), yScale(y), 5, 0, 2 * Math.PI);
              context.fill();
            });
          }}
          width={width}
          height={height}
        />
      </foreignObject>
    </svg>
  );
};

export default XYPlot;

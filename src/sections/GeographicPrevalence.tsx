import { useEffect, useState } from "react";
import * as d3 from "d3";
import { Feature } from "geojson";
import dissolve from "geojson-dissolve";
import Placeholder from "@/components/Placeholder";
import Select from "@/components/Select";
import { Data } from "@/data";
import { clamp } from "@/util/math";

type Props = {
  id: string;
  title: string;
  world: Data["world"];
  data: Data["countries"];
};

/** svg dimensions */
const width = 800;
const height = 400;

const byOptions = ["Country", "Region"];
type By = (typeof byOptions)[number];

const GeographicPrevalence = ({ id, title, world, data }: Props) => {
  const [by, setBy] = useState<By>(byOptions[0]);

  /** rerun d3 code when props change */
  useEffect(() => {
    chart(id, world, data, by);
  }, [id, world, data, by]);

  /** show status */
  if (typeof world === "string" || typeof data === "string")
    return (
      <Placeholder>
        "{title}" table
        <br />
        {typeof world === "string" && world}
        <br />
        {typeof data === "string" && data}
      </Placeholder>
    );

  return (
    <>
      <svg viewBox={[0, -60, width, height + 60].join(" ")} id={id}>
        <text
          className="title"
          x={width / 2}
          y={-50}
          textAnchor="middle"
          dominantBaseline="hanging"
        >
          {title}
        </text>
        <g className="map-container" clipPath="url(#map-clip)">
          <g className="graticules"></g>
          <g className="countries"></g>
        </g>
        <clipPath id="map-clip">
          <rect x="0" y="0" width={width} height={height} />
        </clipPath>
      </svg>
      <Select
        label="Group by:"
        value={by}
        onChange={setBy}
        options={byOptions}
      />
    </>
  );
};

export default GeographicPrevalence;

/** d3 code */

const graticules = d3.geoGraticule().step([20, 20])();

const chart = (
  id: string,
  world: Props["world"],
  data: Props["data"],
  by: By
) => {
  if (typeof data === "string") return;
  if (typeof world === "string") return;

  const svg = d3.select<SVGSVGElement, unknown>("#" + id);

  /** create projection */
  const projection = d3.geoNaturalEarth1();

  /** reset projection */
  const reset = () => {
    projection.center([0, 0]);
    projection.fitSize([width, height], world);
    projection.rotate([0, 0]);
  };
  reset();

  /** get scale when projection fit to contents */
  const baseScale = projection.scale();

  /** path calculator for projection */
  const path = d3.geoPath().projection(projection);

  /** draw graticules */
  svg
    .select(".graticules")
    .selectAll(".graticule")
    .data([graticules])
    .join("path")
    .attr("class", "graticule")
    .attr("d", path);

  /** get range of sample counts */
  const [, max = 1000] = d3.extent(data, (d) => d.samples);

  /** color scale */
  const scale = d3
    .scaleLog<string>()
    .domain([1, max])
    .range(["#475569", "#d239ed"])
    .interpolate(d3.interpolateLab);

  /** map sample count from countries data to world data features */
  let features = world.features.map((feature) => {
    const properties = feature.properties as { [key: string]: string };

    /** find matching data country */
    const match = data.find((d) => d.code === properties.code);

    return {
      ...feature,
      properties,
      code: match?.code || properties.code || "",
      name: match?.name || properties.name || "",
      samples: match?.samples || 0,
      region: match?.region || "",
    };
  });

  /** merge features by region */
  if (by === "Region") {
    /** map of region to feature */
    const regions = new Map<string, (typeof features)[number]>();

    for (const feature of features) {
      /** catch countries without regions */
      if (!feature.region) {
        regions.set(feature.code || feature.name, feature);
        continue;
      }

      /** if existing entry */
      let existing = regions.get(feature.region);
      if (existing) {
        /** merge entry */
        existing.geometry = dissolve([existing, feature]);
        existing.samples += feature.samples;
      } else
      /** set new entry */
        existing = feature;

      /** unset country-specific details */
      existing.code = "";
      existing.name = "";

      /** set entry */
      regions.set(feature.region, existing);
    }

    /** map back to array */
    features = [...regions.values()];
  }

  /** draw features (countries) */
  svg
    .select(".countries")
    .selectAll(".country")
    .data(features)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", (d) => scale(d.samples || 1))
    .attr("data-tooltip", ({ code, name, samples, region }) =>
      [
        `<div class="tooltip-table">`,
        region && `<span>Region</span><span>${region || "???"}</span>`,
        (name || code) &&
          `<span>Country</span><span>${name || "???"} (${code || "??"})</span>`,
        `<span>Samples</span><span>${samples.toLocaleString()}</span>`,
        `</div>`,
      ]
        .filter(Boolean)
        .join("")
    );

  const update = () => {
    /** get current projection components */
    let [x, y] = projection.center();
    const scale = projection.scale();

    /** limit projection */
    const angleLimit = 90 - 90 * (baseScale / scale);
    y = clamp(y, -angleLimit, angleLimit);
    projection.center([x, y]);

    /** update paths based on projection */
    svg.selectAll<Element, Feature>(".graticule").attr("d", path);
    svg.selectAll<Element, Feature>(".country").attr("d", path);
  };

  /** mouse drag handler */
  svg.call(
    d3.drag<SVGSVGElement, unknown, unknown>().on("drag", (event) => {
      /** get current projection components */
      let [x, y] = projection.center();
      const scale = projection.scale();
      let [lambda, phi] = projection.rotate();

      /** update components based on drag */
      lambda += (baseScale / 2) * (event.dx / scale);
      y += (baseScale / 2) * (event.dy / scale);

      /** update projection */
      projection.rotate([lambda, phi]);
      projection.center([x, y]);

      update();
    })
  );

  /** zoom handler */
  svg.call(
    d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([baseScale, baseScale * 10])
      .on("zoom", (event) => {
        projection.scale(event.transform.k);
        update();
      })
  );
};

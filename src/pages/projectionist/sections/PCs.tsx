import type * as ProjectionistAPI from "@/pages/projectionist/project";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@reactuses/core";
import { wrap } from "comlink";
import { groupBy, pick, uniq } from "lodash";
import Select from "@/components/Select";
import SelectMulti from "@/components/SelectMulti";
import ProjectionistWorker from "@/pages/projectionist/project.ts?worker";
import PCChart from "@/pages/projectionist/sections/PCChart";
import {
  SelectOrdination,
  SelectPCs,
} from "@/pages/projectionist/sections/Selections";
import {
  loadSamplePCs,
  loadTaxonPCs,
  useData,
} from "@/pages/projectionist/state";
import { useLegend } from "@/util/legend";
import { useWorker } from "@/util/worker";

const projectionistWorker = wrap<typeof ProjectionistAPI>(
  new ProjectionistWorker(),
);

/** compare series of principal components */
const PCs = () => {
  /** get state */
  const userReads = useData((state) => state.userReads);
  const userTaxa = useData((state) => state.userTaxa);
  const userMeta = useData((state) => state.userMeta);
  const userProjected = useData((state) => state.userProjected);
  const samples = useData((state) => state.samples);
  const taxonPCs = useData((state) => state.taxonPCs);
  const samplePCs = useData((state) => state.samplePCs);
  const PCX = useData((state) => state.PCX);
  const PCY = useData((state) => state.PCY);
  const ordination = useData((state) => state.ordination);

  /** load sample and taxon pc data based on selected ordination */
  useEffect(() => {
    if (!ordination) return;
    loadSamplePCs(ordination);
    loadTaxonPCs(ordination);
  }, [ordination]);

  /** region options */
  const regionOptions = useMemo(
    () => uniq(samples?.map((sample) => sample.region) ?? []).sort(),
    [samples],
  );

  /** selected regions */
  const [_regions, setRegions] = useState<string[]>([]);
  const regions = useDebounce(_regions, 1000);

  /** set selected regions once options load */
  useEffect(() => {
    setRegions(regionOptions);
  }, [regionOptions]);

  /** sample pcs filtered by region */
  const filteredSamplePCs = useMemo(() => {
    if (!samples || !samplePCs) return undefined;

    /** quick lookup region for sample (run) */
    const sampleRegion = Object.fromEntries(
      samples.map(({ run, region }) => [run, region]) ?? [],
    );
    /** ("sample" in pcs is actually SRR (run) instead of SRS (sample)) */

    /** get sample ids whose region is selected */
    const byRegion = Object.keys(samplePCs).filter((sample) => {
      const region = sampleRegion[sample];
      return region && regions.includes(region);
    });

    return pick(samplePCs, byRegion);
  }, [samples, samplePCs, regions]);

  /** color legend */
  const [entry, legend] = useLegend();

  /** data for compendium plot */
  const compendiumPlot = useMemo(() => {
    if (!filteredSamplePCs || !PCX || !PCY) return undefined;
    return {
      color: entry("Compendium").color,
      data: Object.entries(filteredSamplePCs).map(([sample, PCs]) => ({
        x: PCs[PCX] ?? 0,
        y: PCs[PCY] ?? 0,
        sample,
      })),
    };
  }, [filteredSamplePCs, PCX, PCY, entry]);

  /** project user input data */
  const [, projectStatus, runProject] = useWorker(projectionistWorker);

  /** run project data */
  useEffect(
    () =>
      runProject(async () => {
        if (!userReads || !userTaxa || !taxonPCs) return;
        useData.setState({
          userProjected: await projectionistWorker.projectUserData(
            userReads,
            userTaxa,
            taxonPCs,
          ),
        });
      }),
    [userReads, userTaxa, taxonPCs, runProject],
  );

  /** split by */
  const splitOptions = useMemo(
    () =>
      uniq(
        Object.values(userMeta ?? {}).flatMap((sample) => Object.keys(sample)),
      ),
    [userMeta],
  );
  const [split, setSplit] = useState("");

  /** data for user plot */
  const userPlot = useMemo(() => {
    if (!userProjected || !PCX || !PCY) return undefined;

    /** split into groups by selected "split by" option */
    const groups = groupBy<{ sample: string } & (typeof userProjected)[string]>(
      Object.entries(userProjected).map(([sample, PCs]) => ({
        sample,
        ...PCs,
      })),
      ({ sample }) =>
        /** get corresponding group value from user meta */
        split ? String(userMeta?.[sample]?.[split] ?? "") : "Yours",
    );

    /** map groups into data series */
    return Object.entries(groups).map(([group, samples]) => ({
      color: entry(group).color,
      data: samples.map(({ sample, ...PCs }) => ({
        x: PCs[PCX] ?? 0,
        y: PCs[PCY] ?? 0,
        sample,
      })),
    }));
  }, [userProjected, PCX, PCY, split, entry, userMeta]);

  /** combine series */
  const series = useMemo(
    () =>
      [compendiumPlot, ...(userPlot ? userPlot : [])].filter(
        (plot) => plot !== undefined,
      ),
    [compendiumPlot, userPlot],
  );

  /** get absolute max for both series */
  const max = useMemo(() => {
    let max = 0;
    for (const { data } of series)
      for (const { x, y } of data)
        max = Math.max(max, Math.abs(x), Math.abs(y));
    return max;
  }, [series]);

  return (
    <section className="width-lg">
      <h2>Principal Components</h2>

      <div className="flex flex-wrap items-center justify-center gap-8">
        <SelectPCs />
        <SelectOrdination />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-8">
        <SelectMulti
          label="Regions"
          options={regionOptions}
          value={_regions}
          onChange={setRegions}
          className="w-30"
        />
        {userPlot && (
          <Select
            label="Split by"
            options={["", ...splitOptions]}
            value={split}
            onChange={setSplit}
          />
        )}
      </div>

      <div className="flex w-full flex-col items-center gap-8">
        <PCChart
          title={userPlot ? "Compendium vs. Yours" : "Compendium"}
          subtitle={
            compendiumPlot === undefined
              ? "Loading compendium PCs"
              : projectStatus
                ? "Projecting your data"
                : ""
          }
          xLabel={PCX ?? ""}
          yLabel={PCY ?? ""}
          series={series}
          range={max}
        />

        <div className="flex flex-wrap items-center gap-8">
          {Object.entries(legend).map(([key, value], index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="size-4 rounded-full"
                style={{ backgroundColor: value.color }}
              />
              <span>{String(key) || "-"}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PCs;

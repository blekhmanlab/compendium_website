import type { Remote } from "comlink";
import type * as ProjectionistAPI from "@/pages/projectionist/project";
import { useCallback, useEffect, useMemo, useState } from "react";
import { groupBy, isEmpty, pick, uniq } from "lodash";
import { HelpCircleIcon } from "lucide-react";
import Alert from "@/components/Alert";
import Select from "@/components/Select";
import SelectMulti from "@/components/SelectMulti";
import Tooltip from "@/components/Tooltip";
import { useData as useHomeData } from "@/pages/home/state";
import ProjectionistWorker from "@/pages/projectionist/project.ts?worker";
import PCChart from "@/pages/projectionist/sections/PCChart";
import {
  SelectOrdination,
  SelectPCs,
} from "@/pages/projectionist/sections/Selections";
import {
  loadSamplePCs,
  loadTaxonPCs,
  useData as useProjectionistData,
} from "@/pages/projectionist/state";
import { shapePaths, useLegend } from "@/util/legend";
import { useWorker } from "@/util/worker";

/** compare series of principal components */
export default function PCs() {
  /** get state */
  const compendium = useHomeData((state) => state.compendium);
  const userReads = useProjectionistData((state) => state.userReads);
  const userTaxa = useProjectionistData((state) => state.userTaxa);
  const userMeta = useProjectionistData((state) => state.userMeta);
  const userProjected = useProjectionistData((state) => state.userProjected);
  const samples = useProjectionistData((state) => state.samples);
  const taxonPCs = useProjectionistData((state) => state.taxonPCs);
  const samplePCs = useProjectionistData((state) => state.samplePCs);
  const PCX = useProjectionistData((state) => state.PCX);
  const PCY = useProjectionistData((state) => state.PCY);
  const ordination = useProjectionistData((state) => state.ordination);

  /** load sample and taxon pc data based on selected ordination */
  useEffect(() => {
    if (!ordination || !compendium) return;
    loadSamplePCs(compendium, ordination);
    loadTaxonPCs(compendium, ordination);
  }, [compendium, ordination]);

  /** region options */
  const regionOptions = useMemo(
    () =>
      uniq(
        samples
          ?.map((sample) => sample.region)
          .filter((region) => region && region !== "unknown") ?? [],
      ).sort(),
    [samples],
  );

  /** selected regions */
  const [regions, setRegions] = useState<string[]>([]);

  /** set selected regions once options load */
  useEffect(() => {
    // eslint-disable-next-line -- https://github.com/react/react/issues/34045#issuecomment-3801067128
    setRegions(regionOptions);
  }, [regionOptions]);

  /** map of sample (run) to region */
  /** ("sample" in pcs is actually SRR (run) instead of SRS (sample)) */
  const sampleRegions = useMemo(
    () =>
      samples
        ? Object.fromEntries(samples.map(({ run, region }) => [run, region]))
        : undefined,
    [samples],
  );

  /** sample pcs filtered by region */
  const filteredSamplePCs = useMemo(() => {
    if (!sampleRegions || !samplePCs) return undefined;

    /** get sample ids whose region is selected */
    const selected = Object.keys(samplePCs).filter((sample) => {
      const region = sampleRegions[sample];
      return region && regions.includes(region);
    });

    return pick(samplePCs, selected);
  }, [sampleRegions, samplePCs, regions]);

  /** project user input data */
  const [, projectStatus, projectMessage] = useWorker(
    ProjectionistWorker,
    useCallback(
      async (worker: Remote<typeof ProjectionistAPI>) => {
        if (!userReads || !userTaxa || !taxonPCs) return;
        useProjectionistData.setState({
          userProjected: await worker.projectUserData(
            userReads,
            userTaxa,
            taxonPCs,
          ),
        });
      },
      [userReads, userTaxa, taxonPCs],
    ),
  );

  /** group by */
  const groupOptions = useMemo(
    () =>
      uniq(
        Object.values(userMeta ?? {}).flatMap((sample) => Object.keys(sample)),
      ),
    [userMeta],
  );
  const [group, setGroup] = useState("");

  /** order of legend entries */
  const entries: string[] = [
    ...(group !== "Region" ? ["Compendium"] : []),
    "Yours",
    ...(group === "Region" ? regionOptions : []),
    ...(userMeta
      ? Object.values(userMeta).map((meta) => meta[group] ?? "")
      : []),
  ];

  /** legend colors/shapes */
  const [entry, legend] = useLegend(entries);

  /** data for compendium plot */
  const compendiumPlot = useMemo(() => {
    if (!filteredSamplePCs || !PCX || !PCY) return undefined;

    /** compendium data to plot points */
    const data = Object.entries(filteredSamplePCs).map(([sample, PCs]) => ({
      x: PCs[PCX] ?? 0,
      y: PCs[PCY] ?? 0,
      sample,
    }));

    /** no grouping */
    if (group !== "Region")
      return {
        data,
        color: entry("Compendium").color,
        shape: entry("Compendium").shape,
        size: 3,
      };

    /** split into groups by region */
    const groups = groupBy(data, ({ sample }) => sampleRegions?.[sample] ?? "");

    return Object.entries(groups).map(([group, data]) => ({
      data,
      color: entry(group).color,
      shape: entry(group).shape,
      size: 3,
    }));
  }, [sampleRegions, filteredSamplePCs, PCX, PCY, entry, group]);

  /** data for user plot */
  const userPlot = useMemo(() => {
    if (isEmpty(userProjected) || !PCX || !PCY) return undefined;

    /** user data to plot points */
    const data = Object.entries(userProjected).map(([sample, PCs]) => ({
      x: PCs[PCX] ?? 0,
      y: PCs[PCY] ?? 0,
      sample,
    }));

    /** split into groups by selected "group by" option */
    const groups = groupBy(data, ({ sample }) =>
      group && group !== "Region"
        ? String(userMeta?.[sample]?.[group] ?? "")
        : "Yours",
    );

    /** map groups into data series */
    return Object.entries(groups).map(([group, data]) => ({
      data,
      color: entry(group).color,
      shape: entry(group).shape,
      size: 5,
    }));
  }, [userProjected, PCX, PCY, group, entry, userMeta]);

  /** combine series */
  const series = useMemo(
    () =>
      [compendiumPlot, userPlot].flat().filter((plot) => plot !== undefined),
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

      <p>
        See your and our samples projected into the same principal component
        space.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-8">
        <SelectPCs />
        <SelectOrdination />
        <SelectMulti
          label={
            <>
              Regions
              <Tooltip content="Show samples tagged as being from these geographic regions.">
                <HelpCircleIcon />
              </Tooltip>
            </>
          }
          options={regionOptions}
          value={regions}
          onChange={setRegions}
          className="w-30"
        />
        <Select
          label={
            <>
              Group by
              <Tooltip content="Color points by this property.">
                <HelpCircleIcon />
              </Tooltip>
            </>
          }
          options={["", "Region", ...groupOptions]}
          value={group}
          onChange={setGroup}
        />
      </div>

      {compendiumPlot === undefined ? (
        <Alert type="loading">Loading compendium data</Alert>
      ) : projectStatus === "loading" ? (
        <Alert type="loading">{projectMessage || "Projecting your data"}</Alert>
      ) : projectStatus === "error" ? (
        <Alert type="error">
          {projectMessage || "Error projecting your data"}
        </Alert>
      ) : null}

      <div className="flex w-full flex-col items-center gap-8">
        <PCChart
          title="Compendium vs. Yours"
          xLabel={PCX ?? ""}
          yLabel={PCY ?? ""}
          series={series}
          range={max}
        />

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {Object.entries(legend).map(([key, { color, shape }], index) => (
            <div key={index} className="flex items-center gap-2">
              <svg viewBox="-1 -1 2 2" className="size-4">
                <path d={shapePaths[shape ?? ""] ?? ""} fill={color} />
              </svg>
              <span>{String(key) || "-"}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

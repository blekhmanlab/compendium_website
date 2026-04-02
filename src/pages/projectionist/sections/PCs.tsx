import type { SamplePCs } from "@/pages/projectionist/data/sample-pcs";
import type { TaxonPCs } from "@/pages/projectionist/data/taxon-pcs";
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
import { useData } from "@/pages/projectionist/state";
import { useLegend } from "@/util/legend";
import { useWorker } from "@/util/worker";

const projectionistWorker = wrap<typeof ProjectionistAPI>(
  new ProjectionistWorker(),
);

/** compare series of principal components */
const PCs = () => {
  /** get state */
  const taxa = useData((state) => state.userData?.taxa);
  const userSamples = useData((state) => state.userData?.samples);
  const reads = useData((state) => state.userData?.reads);
  const taxaMap = useData((state) => state.taxaMap);
  const taxonPCs = useData((state) => state.taxonPCs);
  const samplePCs = useData((state) => state.samplePCs);
  const samples = useData((state) => state.samples);
  const userProjected = useData((state) => state.userProjected);
  const pcX = useData((state) => state.selectedPcX);
  const pcY = useData((state) => state.selectedPcY);
  const ordination = useData((state) => state.selectedOrdination);

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

  /** sample pcs filtered by ordination and region */
  const filteredSamplePCs = useMemo(() => {
    if (!samples || !samplePCs || !ordination) return undefined;

    /** quick lookup region for sample (run) */
    const sampleRegion = Object.fromEntries(
      samples.map(({ run, region }) => [run, region]) ?? [],
    );
    /** ("sample" in pcs is actually SRR (run) instead of SRS (sample)) */

    /** filter by selected ordination */
    const byOrdination = samplePCs[ordination as keyof SamplePCs] ?? {};

    /** filter by selected regions */
    const byRegion = Object.keys(byOrdination).filter((sample) => {
      const region = sampleRegion[sample];
      return region && regions.includes(region);
    });

    return pick(byOrdination, byRegion);
  }, [samples, samplePCs, ordination, regions]);

  /** taxon pcs filtered by ordination */
  const filteredTaxonPCs = useMemo(() => {
    if (!taxonPCs || !ordination) return undefined;
    return taxonPCs[ordination as keyof TaxonPCs] ?? {};
  }, [taxonPCs, ordination]);

  /** color legend */
  const [entry, legend] = useLegend();

  /** data for compendium plot */
  const compendiumPlot = useMemo(() => {
    if (!filteredSamplePCs || !pcX || !pcY) return undefined;
    return {
      color: entry("Compendium").color,
      data: Object.entries(filteredSamplePCs).map(([sample, pcs]) => ({
        x: pcs[pcX],
        y: pcs[pcY],
        sample,
      })),
    };
  }, [filteredSamplePCs, pcX, pcY, entry]);

  useEffect(() => {
    console.log({ entry });
  }, [entry]);

  /** project user input data */
  const [, projectStatus, runProject] = useWorker(projectionistWorker);

  /** run project data */
  useEffect(
    () =>
      runProject(async () => {
        if (!taxa || !userSamples || !reads || !taxaMap || !filteredTaxonPCs)
          return;
        useData.setState({
          userProjected: await projectionistWorker.projectUserData(
            taxa,
            reads,
            userSamples,
            taxaMap,
            filteredTaxonPCs,
          ),
        });
      }),
    [taxa, reads, userSamples, taxaMap, filteredTaxonPCs, runProject],
  );

  /** get user meta */
  const userMeta = useData((state) => state.userMeta);

  /** group by */
  const groupOptions = useMemo(
    () =>
      uniq(
        Object.values(userMeta ?? {}).flatMap((sample) => Object.keys(sample)),
      ),
    [userMeta],
  );
  const [group, setGroup] = useState("");

  /** data for user plot */
  const userPlot = useMemo(() => {
    if (!userProjected || !pcX || !pcY) return undefined;

    /** split into groups by selected "group by" option */
    const groups = groupBy(
      Object.entries(userProjected).map(([sample, pcs]) => ({
        sample,
        ...pcs,
      })),
      ({ sample }) =>
        /** get corresponding group value from user meta */
        group ? String(userMeta?.[sample]?.[group] ?? "") : "Yours",
    );

    /** map groups into data series */
    return Object.entries(groups).map(([group, samples]) => ({
      color: entry(group).color,
      data: samples.map(({ sample, ...pcs }) => ({
        x: pcs[pcX],
        y: pcs[pcY],
        sample,
      })),
    }));
  }, [userProjected, pcX, pcY, group, entry, userMeta]);

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
            options={["", ...groupOptions]}
            value={group}
            onChange={setGroup}
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
          xLabel={pcX ?? ""}
          yLabel={pcY ?? ""}
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

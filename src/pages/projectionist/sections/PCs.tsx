import type { SampleWeights } from "@/pages/projectionist/data/sample-weights";
import type { PC } from "@/pages/projectionist/project";
import type * as ProjectionistAPI from "@/pages/projectionist/project";
import { useEffect, useMemo, useState } from "react";
import { wrap } from "comlink";
import { pick, uniq } from "lodash";
import Select from "@/components/Select";
import SelectMulti from "@/components/SelectMulti";
import { pcs } from "@/pages/projectionist/project";
import ProjectionistWorker from "@/pages/projectionist/project.ts?worker";
import PCChart from "@/pages/projectionist/sections/PCChart";
import { useData } from "@/pages/projectionist/state";
import { useLegend } from "@/util/legend";
import { useWorker } from "@/util/worker";

const projectionistWorker = wrap<typeof ProjectionistAPI>(
  new ProjectionistWorker(),
);

/** compare plots of principal components */
const PCs = () => {
  /** get state */
  const taxa = useData((state) => state.userData?.taxa);
  const userSamples = useData((state) => state.userData?.samples);
  const reads = useData((state) => state.userData?.reads);
  const taxaMap = useData((state) => state.taxaMap);
  const taxonWeights = useData((state) => state.taxonWeights);
  const sampleWeights = useData((state) => state.sampleWeights);
  const samples = useData((state) => state.samples);
  const userProjected = useData((state) => state.userProjected);

  /** selected principal components */
  const [pcA, setPcA] = useState<PC>(pcs[0]);
  const [pcB, setPcB] = useState<PC>(pcs[1]);

  /** ordination options */
  const ordinationOptions = Object.keys(sampleWeights || {});

  /** selected ordination */
  const [ordination, setOrdination] = useState("");

  /** set ordination once options loaded */
  const first = ordinationOptions[0];
  if (!ordination && first) setOrdination(first);

  /** region options */
  const regionOptions = useMemo(
    () => uniq(samples?.map((sample) => sample.region) ?? []).sort(),
    [samples],
  );

  /** selected regions */
  const [regions, setRegions] = useState<string[]>([]);

  /** set selected regions once options load */
  useEffect(() => {
    setRegions(regionOptions);
  }, [regionOptions]);

  /** sample weights filtered by ordination and region */
  const filteredSampleWeights = useMemo(() => {
    if (!samples || !sampleWeights || !ordination) return undefined;

    /** quick lookup region for sample (run) */
    const sampleRegion = Object.fromEntries(
      samples.map(({ run, region }) => [run, region]) ?? [],
    );
    /** ("sample" in weights is actually SRR (run) instead of SRS (sample)) */

    /** filter by selected ordination */
    const byOrdination = sampleWeights[ordination as keyof SampleWeights] ?? {};

    /** filter by selected regions */
    const byRegion = Object.keys(byOrdination).filter((sample) => {
      const region = sampleRegion[sample];
      return region && regions.includes(region);
    });

    return pick(byOrdination, byRegion);
  }, [samples, sampleWeights, ordination, regions]);

  /** data for compendium plot */
  const compendiumPlot = useMemo(() => {
    if (!filteredSampleWeights) return undefined;
    return Object.values(filteredSampleWeights).map((datum) => ({
      x: datum[pcA],
      y: datum[pcB],
    }));
  }, [filteredSampleWeights, pcA, pcB]);

  /** project user input data */
  const [, projectStatus, runProject] = useWorker(projectionistWorker);

  /** run project data */
  useEffect(
    () =>
      runProject(async () => {
        if (!taxa || !userSamples || !reads || !taxaMap || !taxonWeights)
          return;
        useData.setState({
          userProjected: await projectionistWorker.projectUserData(
            taxa,
            reads,
            userSamples,
            taxaMap,
            taxonWeights,
          ),
        });
      }),
    [taxa, reads, userSamples, taxaMap, taxonWeights, runProject],
  );

  /** get user meta */
  const userMeta = useData((state) => state.userMeta);

  /** color legend */
  const [entry, legend] = useLegend();

  /** color by */
  const colorOptions = useMemo(
    () =>
      uniq(
        Object.values(userMeta ?? {}).flatMap((sample) => Object.keys(sample)),
      ),
    [userMeta],
  );
  const [color, setColor] = useState("");

  /** data for user plot */
  const userPlot = useMemo(() => {
    if (!userProjected) return undefined;
    return Object.entries(userProjected).map(([sample, pcs]) => ({
      x: pcs[pcA],
      y: pcs[pcB],
      color: color
        ? entry(String(userMeta?.[sample]?.[color] ?? "")).color
        : undefined,
    }));
  }, [userProjected, pcA, pcB, color, entry, userMeta]);

  return (
    <section>
      <h2>Principal Components</h2>

      <div className="flex gap-4">
        <Select label="X-axis" options={pcs} value={pcA} onChange={setPcA} />
        <Select label="Y-axis" options={pcs} value={pcB} onChange={setPcB} />
        <Select
          label="Ordination"
          options={ordinationOptions}
          value={ordination ?? ""}
          onChange={setOrdination}
        />
      </div>

      <div
        className="
          grid w-full grid-cols-2 content-start gap-8
          max-md:grid-cols-1
        "
      >
        {compendiumPlot ? (
          <div className="flex flex-col items-center gap-4">
            <PCChart
              title="Compendium"
              xLabel={pcA}
              yLabel={pcB}
              data={compendiumPlot}
            />
            <SelectMulti
              label="Regions"
              options={regionOptions}
              value={regions}
              onChange={setRegions}
            />
          </div>
        ) : (
          <div className="placeholder">Loading compendium PCs</div>
        )}

        {userPlot ? (
          <div className="flex flex-col items-center gap-4">
            <PCChart title="Yours" xLabel={pcA} yLabel={pcB} data={userPlot} />
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
            <Select
              label="Color"
              options={["", ...colorOptions]}
              value={color}
              onChange={setColor}
            />
          </div>
        ) : projectStatus === "loading" ? (
          <div className="placeholder">Loading user PCs</div>
        ) : (
          <div
            className="
              placeholder border border-dashed border-slate-500 bg-transparent
            "
          >
            Load your data to compare
          </div>
        )}
      </div>
    </section>
  );
};

export default PCs;

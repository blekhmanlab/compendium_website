import type { SampleWeights } from "@/pages/projectionist/data/sample-weights";
import type { PC } from "@/pages/projectionist/project";
import type * as ProjectionistAPI from "@/pages/projectionist/project";
import { useEffect, useMemo, useState } from "react";
import { wrap } from "comlink";
import { mapValues } from "lodash";
import Select from "@/components/Select";
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
  /** selected principal components */
  const [pcA, setPcA] = useState<PC>(pcs[0]);
  const [pcB, setPcB] = useState<PC>(pcs[1]);

  /** project user input data */
  const [, projectStatus, runProject] = useWorker(projectionistWorker);

  /** get inputs for projecting */
  const taxa = useData((state) => state.userData?.taxa);
  const samples = useData((state) => state.userData?.samples);
  const reads = useData((state) => state.userData?.reads);
  const taxaMap = useData((state) => state.taxaMap);
  const taxonWeights = useData((state) => state.taxonWeights);
  const sampleWeights = useData((state) => state.sampleWeights);

  /** run project data */
  useEffect(
    () =>
      runProject(async () => {
        if (!taxa || !samples || !reads || !taxaMap || !taxonWeights) return;
        useData.setState({
          userProjected: await projectionistWorker.projectUserData(
            taxa,
            reads,
            samples,
            taxaMap,
            taxonWeights,
          ),
        });
      }),
    [taxa, reads, samples, taxaMap, taxonWeights, runProject],
  );

  /** region option filter */
  const regionOptions = Object.keys(sampleWeights || {});
  const [region, setRegion] = useState("");
  /** set region once options loaded */
  const first = regionOptions[0];
  if (!region && first) setRegion(first);

  /** sample weights filtered by region */
  const regionWeights = useMemo(
    () => sampleWeights?.[region as keyof SampleWeights],
    [sampleWeights, region],
  );

  /** get user meta */
  const meta = useData((state) => state.userMeta);

  /** color legend */
  const [entry, legend] = useLegend();

  /** color by */
  const colorOptions = ["group", "batch", "sequencer"];
  const [color, setColor] = useState("group");

  /** get outputs of projecting */
  const _projected = useData((state) => state.userProjected);
  const projected = _projected
    ? mapValues(_projected, (pcs, sample) => ({
        ...pcs,
        color: entry(String(meta?.[sample]?.[color] ?? "")).color,
      }))
    : undefined;

  const compendiumPlot = useMemo(() => {
    if (!regionWeights) return undefined;
    return Object.values(regionWeights).map((datum) => ({
      x: datum[pcA],
      y: datum[pcB],
    }));
  }, [regionWeights, pcA, pcB]);

  return (
    <section>
      <h2>Principal Components</h2>

      <div className="flex gap-4">
        <Select label="X-axis" options={pcs} value={pcA} onChange={setPcA} />
        <Select label="Y-axis" options={pcs} value={pcB} onChange={setPcB} />
        <Select
          label="Region"
          options={regionOptions}
          value={region ?? ""}
          onChange={setRegion}
        />
        <Select
          label="Color by"
          options={colorOptions}
          value={color}
          onChange={setColor}
        />
      </div>

      <div
        className="
          grid w-full grid-cols-2 place-items-start gap-4
          *:aspect-square
          max-md:grid-cols-1
        "
      >
        {compendiumPlot ? (
          <PCChart
            title="Compendium"
            xLabel={pcA}
            yLabel={pcB}
            data={compendiumPlot}
          />
        ) : (
          <div className="placeholder">Loading compendium PCs</div>
        )}

        {projected ? (
          <PCChart
            title="Yours"
            xLabel={pcA}
            yLabel={pcB}
            data={Object.values(projected).map(({ color, ...pcs }) => ({
              x: pcs[pcA],
              y: pcs[pcB],
              color,
            }))}
          />
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
    </section>
  );
};

export default PCs;

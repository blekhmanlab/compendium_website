import type { PC } from "@/pages/projectionist/project";
import type * as ProjectionistAPI from "@/pages/projectionist/project";
import { useEffect, useState } from "react";
import { wrap } from "comlink";
import Select from "@/components/Select";
import { pcs } from "@/pages/projectionist/project";
import ProjectionistWorker from "@/pages/projectionist/project.ts?worker";
import PCChart from "@/pages/projectionist/sections/PCChart";
import { useData } from "@/pages/projectionist/state";
import { useWorker } from "@/util/worker";

const projectionistWorker = wrap<typeof ProjectionistAPI>(
  new ProjectionistWorker(),
);

const PCs = () => {
  /** selected principal components */
  const [pcA, setPcA] = useState<PC>(pcs[0]);
  const [pcB, setPcB] = useState<PC>(pcs[1]);

  /** project user input data */
  const [, projectStatus, runProject] = useWorker(projectionistWorker);

  console.log(projectStatus);

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

  /** get outputs of projecting */
  const projected = useData((state) => state.userProjected);

  return (
    <section>
      <h2>Principal Components</h2>

      <div className="flex gap-4">
        <Select label="X-axis" options={pcs} value={pcA} onChange={setPcA} />
        <Select label="Y-axis" options={pcs} value={pcB} onChange={setPcB} />
      </div>

      <div
        className="
          grid w-full grid-cols-2 place-items-start gap-4
          *:min-h-0 *:min-w-0
          max-md:grid-cols-1
        "
      >
        {sampleWeights?.full && (
          <PCChart
            title="Compendium"
            xLabel={pcA}
            yLabel={pcB}
            data={Object.values(sampleWeights.full).map((datum) => ({
              x: datum[pcA],
              y: datum[pcB],
            }))}
          />
        )}
        {!sampleWeights?.full && (
          <div className="placeholder">Loading compendium PCs</div>
        )}

        {projected && (
          <PCChart
            title="Yours"
            xLabel={pcA}
            yLabel={pcB}
            data={Object.values(projected).map((datum) => ({
              x: datum[pcA],
              y: datum[pcB],
            }))}
          />
        )}
        {projectStatus === "" && !projected && (
          <div
            className="
              placeholder border border-dashed border-slate-500 bg-transparent
            "
          >
            Load your data to compare
          </div>
        )}
        {projectStatus === "loading" && (
          <div className="placeholder">Loading user PCs</div>
        )}
      </div>
    </section>
  );
};

export default PCs;

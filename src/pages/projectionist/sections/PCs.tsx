import type { PC } from "@/pages/projectionist/project";
import type * as ProjectionistAPI from "@/pages/projectionist/project";
import { useEffect, useState } from "react";
import { wrap } from "comlink";
import Select from "@/components/Select";
import { pcs } from "@/pages/projectionist/project";
import ProjectionistWorker from "@/pages/projectionist/project.ts?worker";
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

  /** get inputs for projecting */
  const taxa = useData((state) => state.userData?.taxa);
  const samples = useData((state) => state.userData?.samples);
  const reads = useData((state) => state.userData?.reads);
  const taxaMap = useData((state) => state.taxaMap);
  const sampleWeights = useData((state) => state.sampleWeights);

  /** run project data */
  useEffect(
    () =>
      runProject(async () => {
        if (!taxa || !samples || !reads || !taxaMap || !sampleWeights) return;
        useData.setState({
          userProjected: await projectionistWorker.projectUserData(
            taxa,
            reads,
            samples,
            taxaMap,
            sampleWeights.full,
          ),
        });
      }),
    [taxa, reads, samples, taxaMap, sampleWeights, runProject],
  );

  /** get outputs of projecting */
  const projected = useData((state) => state.userProjected);

  console.log(sampleWeights?.full);

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
        {sampleWeights && <div>chart</div>}
        {!sampleWeights && (
          <div className="placeholder">Loading compendium PCs</div>
        )}
        {projected && <div>chart</div>}
        {projectStatus === "loading" && (
          <div className="placeholder">Loading user PCs</div>
        )}
        {projectStatus === "" && (
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

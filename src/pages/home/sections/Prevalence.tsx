import type { Reads } from "@/pages/home/data/projects";
import type { Phyla } from "@/pages/home/data/taxa";
import { useState } from "react";
import Select from "@/components/Select";
import Tooltip from "@/components/Tooltip";
import { useData } from "@/pages/home/state";
import Map from "./Map";
import PhylaChart from "./PhylaChart";
import ReadsChart from "./ReadsChart";
import { tooltips } from "./Search";

const chartOptions = ["Phyla", "Reads"] as const;
type Chart = (typeof chartOptions)[number];

const Prevalence = () => {
  /** get global state */
  const phyla = useData((state) => state.phyla);
  const reads = useData((state) => state.reads);
  const selectedFeature = useData((state) => state.selectedFeature);

  /** local state */
  const [chart, setChart] = useState<Chart>(chartOptions[0]);

  return (
    <section className="width-lg">
      <h2>Prevalence</h2>

      {selectedFeature ? (
        <p>
          Selected:&nbsp;&nbsp;&nbsp;
          {selectedFeature.country || selectedFeature.region}
        </p>
      ) : (
        <p>
          Select a <Tooltip content={tooltips["country"]}>country</Tooltip> or{" "}
          <Tooltip content={tooltips["region"]}>region</Tooltip> to filter by.
        </p>
      )}

      <div
        className="
          grid w-full grid-cols-[2fr_1fr] gap-8
          max-lg:grid-cols-1
        "
      >
        <Map />

        <div className="flex flex-col items-center gap-4">
          <Select
            label="Chart"
            value={chart}
            onChange={setChart}
            options={chartOptions}
          />
          <div className="min-h-80 w-full grow">
            {chart === "Phyla" && <PhylaChart data={phyla as Phyla} />}
            {chart === "Reads" && <ReadsChart data={reads as Reads} />}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Prevalence;

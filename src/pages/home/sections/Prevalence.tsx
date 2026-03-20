import type { ByReads } from "@/pages/home/data/project";
import type { ByPhylum } from "@/pages/home/data/taxa";
import { useState } from "react";
import Select from "@/components/Select";
import { useData } from "@/pages/home/state";
import Map from "./Map";
import PhylaChart from "./PhylaChart";
import ReadsChart from "./ReadsChart";
import { tooltips } from "./Search";

const chartOptions = ["Phyla", "Reads"] as const;
type Chart = (typeof chartOptions)[number];

const Prevalence = () => {
  /** get global state */
  const byPhylum = useData((state) => state.byPhylum);
  const byReads = useData((state) => state.byReads);
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
          Select a <span data-tooltip={tooltips["country"]}>country</span> or{" "}
          <span data-tooltip={tooltips["region"]}>region</span> to filter by.
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
            label="Chart:"
            value={chart}
            onChange={setChart}
            options={chartOptions}
          />
          <div className="min-h-80 w-full grow">
            {chart === "Phyla" && <PhylaChart data={byPhylum as ByPhylum} />}
            {chart === "Reads" && <ReadsChart data={byReads as ByReads} />}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Prevalence;

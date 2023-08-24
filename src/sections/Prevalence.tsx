import { useState } from "react";
import Select from "@/components/Select";
import { useData } from "@/data";
import Bar from "@/sections/Bar";
import Histogram from "@/sections/Histogram";
import Map from "@/sections/Map";
import { tooltips } from "@/sections/Search";
import classes from "./Prevalence.module.css";

const vizOptions = ["Phyla", "Reads"];
type Viz = (typeof vizOptions)[number];

const Prevalence = () => {
  /** get global state */
  const byPhylum = useData((state) => state.byPhylum);
  const byReads = useData((state) => state.byReads);
  const selectedFeature = useData((state) => state.selectedFeature);

  /** local state */
  const [viz, setViz] = useState<Viz>(vizOptions[0]);

  return (
    <section className={classes.section}>
      <h2>Prevalence</h2>

      {!selectedFeature && (
        <p>
          Select a <span data-tooltip={tooltips["country"]}>country</span> or{" "}
          <span data-tooltip={tooltips["region"]}>region</span> to filter by.
        </p>
      )}

      {selectedFeature && (
        <p>
          Selected:&nbsp;&nbsp;&nbsp;
          {selectedFeature.country || selectedFeature.region}
        </p>
      )}

      <div className={classes.cols}>
        <Map />

        <div className="sub-section">
          <Select
            label="Chart:"
            value={viz}
            onChange={setViz}
            options={vizOptions}
          />
          {viz === "Phyla" && (
            <Bar title="Phyla" data={byPhylum} datumKey="phylum" />
          )}
          {viz === "Reads" && <Histogram title="Reads" data={byReads} />}
        </div>
      </div>
    </section>
  );
};

export default Prevalence;

import { useData } from "@/data";
import Chart from "@/sections/Chart";
import Map from "@/sections/Map";
import { tooltips } from "@/sections/Search";
import classes from "./Prevalence.module.css";

const Prevalence = () => {
  /** get global state */
  const byPhylum = useData((state) => state.byPhylum);
  const selectedFeature = useData((state) => state.selectedFeature);

  return (
    <section>
      <h2>Prevalence</h2>

      {!selectedFeature && (
        <p>
          Select a <span data-tooltip={tooltips["country"]}>country</span> or{" "}
          <span data-tooltip={tooltips["region"]}>region</span> to filter by
          number of samples.
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
        <Chart data={byPhylum} datumKey="phylum" />
      </div>
    </section>
  );
};

export default Prevalence;

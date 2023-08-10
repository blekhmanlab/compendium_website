import { useData } from "@/data";
import Chart from "@/sections/Chart";
import Map from "@/sections/Map";
import classes from "./Prevalence.module.css";

const Prevalence = () => {
  /** get global state */
  const byPhylum = useData((state) => state.byPhylum);

  return (
    <section>
      <h2>Prevalence</h2>

      <div className={classes.cols}>
        <Chart data={byPhylum} datumKey="phylum" />
        <Map />
      </div>
    </section>
  );
};

export default Prevalence;

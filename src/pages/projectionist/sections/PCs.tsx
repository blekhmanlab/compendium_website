import { useState } from "react";
import Select from "@/components/Select";
import XYPlot from "@/components/XYPlot";
import { useData } from "@/pages/projectionist/Projectionist";
import classes from "./PCs.module.css";

const pcs = ["PC1", "PC2", "PC3", "PC4", "PC5", "PC6", "PC7", "PC8"] as const;

type PC = (typeof pcs)[number];

const PCs = () => {
  const [pcA, setPcA] = useState<PC>(pcs[0]);
  const [pcB, setPcB] = useState<PC>(pcs[1]);

  const projected = useData((state) => state.projected).map((d) => ({
    x: d[pcA],
    y: d[pcB],
  }));

  return (
    <section>
      <h2>Principal Components</h2>

      <div className={classes.controls}>
        <Select label="X-axis" options={pcs} value={pcA} onChange={setPcA} />
        <Select label="Y-axis" options={pcs} value={pcB} onChange={setPcB} />
      </div>

      <div className={classes.columns}>
        <XYPlot xLabel={pcA} yLabel={pcB} data={projected} />
      </div>
    </section>
  );
};

export default PCs;

import { useState } from "react";
import Select from "@/components/Select";
import { useData } from "@/pages/projectionist/Projectionist";
import classes from "./PCs.module.css";
import XYPlot from "./XYPlot";

const pcs = ["PC1", "PC2", "PC3", "PC4", "PC5", "PC6", "PC7", "PC8"] as const;

type PC = (typeof pcs)[number];

const PCs = () => {
  const [pcA, setPcA] = useState<PC>(pcs[0]);
  const [pcB, setPcB] = useState<PC>(pcs[1]);

  const compendium = useData((state) => state.compendium.projected).map(
    (d) => ({
      x: d[pcA] ?? 0,
      y: d[pcB] ?? 0,
    }),
  );

  const user = useData((state) => state.userData.projected).map((d) => ({
    x: d[pcA] ?? 0,
    y: d[pcB] ?? 0,
  }));

  return (
    <section>
      <h2>Principal Components</h2>

      <div className={classes.controls}>
        <Select label="X-axis" options={pcs} value={pcA} onChange={setPcA} />
        <Select label="Y-axis" options={pcs} value={pcB} onChange={setPcB} />
      </div>

      <div className={classes.columns}>
        <XYPlot
          title="Compendium Data"
          xLabel={pcA}
          yLabel={pcB}
          data={compendium}
        />
        <XYPlot title="Your Data" xLabel={pcA} yLabel={pcB} data={user} />
      </div>
    </section>
  );
};

export default PCs;

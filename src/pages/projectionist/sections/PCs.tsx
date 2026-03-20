import { useState } from "react";
import Select from "@/components/Select";

const pcs = ["PC1", "PC2", "PC3", "PC4", "PC5", "PC6", "PC7", "PC8"] as const;

type PC = (typeof pcs)[number];

const PCs = () => {
  const [pcA, setPcA] = useState<PC>(pcs[0]);
  const [pcB, setPcB] = useState<PC>(pcs[1]);

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
      ></div>
    </section>
  );
};

export default PCs;

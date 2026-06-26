import { useEffect } from "react";
import Select from "@/components/Select";
import { ordinations, PCs } from "@/pages/projectionist/project";
import {
  setOrdination,
  setPCX,
  setPCY,
  useData,
} from "@/pages/projectionist/state";

/** pc selectors */
export function SelectPCs() {
  const PCX = useData((state) => state.PCX);
  const PCY = useData((state) => state.PCY);

  useEffect(() => {
    if (!PCX) setPCX(PCs[0]!);
    if (!PCY) setPCY(PCs[1]!);
  }, [PCX, PCY]);

  if (!PCX || !PCY) return null;

  return (
    <>
      <Select label="X-axis" options={PCs} value={PCX} onChange={setPCX} />
      <Select label="Y-axis" options={PCs} value={PCY} onChange={setPCY} />
    </>
  );
}

/** ordination selector */
export function SelectOrdination() {
  const ordination = useData((state) => state.ordination);

  useEffect(() => {
    if (!ordination) setOrdination("full");
  }, [ordination]);

  return (
    <Select
      label="Ordination"
      options={ordinations}
      value={ordination ?? ""}
      onChange={setOrdination}
    />
  );
}

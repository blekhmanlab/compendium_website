import { useEffect } from "react";
import Select from "@/components/Select";
import { pcs } from "@/pages/projectionist/project";
import {
  setSelectedOrdination,
  setselectedPcX,
  setSelectedPcY,
  useData,
} from "@/pages/projectionist/state";

/** pc selectors */
export const SelectPCs = () => {
  const pcX = useData((state) => state.selectedPcX);
  const pcY = useData((state) => state.selectedPcY);

  useEffect(() => {
    if (!pcX) setselectedPcX(pcs[0]);
    if (!pcY) setSelectedPcY(pcs[1]);
  }, [pcX, pcY]);

  if (!pcX || !pcY) return null;

  return (
    <>
      <Select
        label="X-axis"
        options={pcs}
        value={pcX}
        onChange={setselectedPcX}
      />
      <Select
        label="Y-axis"
        options={pcs}
        value={pcY}
        onChange={setSelectedPcY}
      />
    </>
  );
};

/** ordination options */
const ordinationOptions = ["full", "asia", "europe", "noneurope"];

/** ordination selector */
export const SelectOrdination = () => {
  const ordination = useData((state) => state.selectedOrdination);

  useEffect(() => {
    if (!ordination) setSelectedOrdination("full");
  }, [ordination]);

  return (
    <Select
      label="Ordination"
      options={ordinationOptions}
      value={ordination ?? ""}
      onChange={setSelectedOrdination}
    />
  );
};

import { useEffect } from "react";
import Select from "@/components/Select";
import { setSelectedOrdination, useData } from "@/pages/projectionist/state";

/** ordination options */
const ordinationOptions = ["full", "asia", "europe", "noneurope"];

/** ordination selector */
const SelectOrdination = () => {
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

export default SelectOrdination;

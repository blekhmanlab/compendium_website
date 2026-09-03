import { useEffect } from "react";
import { HelpCircleIcon } from "lucide-react";
import Select from "@/components/Select";
import Tooltip from "@/components/Tooltip";
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
      <Select
        label={
          <>
            X-axis
            <Tooltip content="Which principal component to plot on the X-axis.">
              <HelpCircleIcon />
            </Tooltip>
          </>
        }
        options={PCs}
        value={PCX}
        onChange={setPCX}
      />
      <Select
        label={
          <>
            Y-axis
            <Tooltip content="Which principal component to plot on the Y-axis.">
              <HelpCircleIcon />
            </Tooltip>
          </>
        }
        options={PCs}
        value={PCY}
        onChange={setPCY}
      />
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
      label={
        <>
          Ordination
          <Tooltip content="Which subset of geographic region loadings to use in projection.">
            <HelpCircleIcon />
          </Tooltip>
        </>
      }
      options={ordinations}
      value={ordination ?? ""}
      onChange={setOrdination}
    />
  );
}

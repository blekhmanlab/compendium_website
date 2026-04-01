import type { TaxonPCs } from "@/pages/projectionist/data/taxon-pcs";
import { useMemo } from "react";
import clsx from "clsx";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
} from "lucide-react";
import {
  SelectOrdination,
  SelectPCs,
} from "@/pages/projectionist/sections/Selections";
import { useData } from "@/pages/projectionist/state";

/** top-n extreme taxa */
const count = 3;

const Extremes = () => {
  /** get state */
  const taxonPCs = useData((state) => state.taxonPCs);
  const pcX = useData((state) => state.selectedPcX);
  const pcY = useData((state) => state.selectedPcY);
  const ordination = useData((state) => state.selectedOrdination);

  /** taxon pcs filtered by ordination */
  const filteredTaxonPCs = useMemo(() => {
    if (!taxonPCs || !ordination) return undefined;
    return taxonPCs[ordination as keyof TaxonPCs] ?? {};
  }, [taxonPCs, ordination]);

  /** get extreme values of taxon pcs */
  const extremes = useMemo(() => {
    if (!filteredTaxonPCs || !pcX || !pcY) return undefined;
    const xs = Object.entries(filteredTaxonPCs)
      .map(([taxon, pcs]) => ({ taxon, pc: pcs[pcX] }))
      .sort((a, b) => a.pc - b.pc);
    const ys = Object.entries(filteredTaxonPCs)
      .map(([taxon, pcs]) => ({ taxon, pc: pcs[pcY] }))
      .sort((a, b) => a.pc - b.pc);
    return [
      {
        className: "col-start-3",
        label: (
          <>
            <ArrowUpIcon />
            Top-most taxa
          </>
        ),
        header: pcY,
        data: ys.slice(-count).toReversed(),
      },
      {
        className: "col-start-1 row-start-2",
        label: (
          <>
            <ArrowLeftIcon />
            Left-most taxa
          </>
        ),
        header: pcX,
        data: xs.slice(0, count),
      },
      {
        className: "col-start-5 row-start-2",
        label: (
          <>
            Right-most taxa
            <ArrowRightIcon />
          </>
        ),
        header: pcX,
        data: xs.slice(-count).toReversed(),
      },
      {
        className: "col-start-3 row-start-3",
        label: (
          <>
            Bottom-most taxa
            <ArrowDownIcon />
          </>
        ),
        header: pcY,
        data: ys.slice(0, count),
      },
    ];
  }, [filteredTaxonPCs, pcX, pcY]);

  return (
    <section className="width-lg">
      <h2>Taxon Extremes</h2>

      <div className="flex flex-wrap items-center justify-center gap-8">
        <SelectPCs />
        <SelectOrdination />
      </div>

      <div
        className="
          grid grid-cols-8 gap-8
          max-lg:flex max-lg:flex-col
        "
      >
        {extremes?.map(({ className, label, header, data }, index) => (
          <div
            key={index}
            className={clsx(
              `
                col-span-4 flex w-full flex-col gap-4
                max-lg:col-span-[unset]
              `,
              className,
            )}
          >
            <p>{label}</p>
            <table className="table-fixed">
              <thead>
                <tr>
                  <th>Taxon</th>
                  <th className="w-20">{header}</th>
                </tr>
              </thead>
              <tbody>
                {data.map(({ taxon, pc }, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>{taxon.split("|").join(" | ")}</td>
                    <td>{pc.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Extremes;

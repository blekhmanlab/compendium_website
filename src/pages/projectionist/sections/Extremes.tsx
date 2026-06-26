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

export default function Extremes() {
  /** get state */
  const taxonPCs = useData((state) => state.taxonPCs);
  const PCX = useData((state) => state.PCX);
  const PCY = useData((state) => state.PCY);

  /** get extreme values of taxon pcs */
  const extremes = useMemo(() => {
    if (!taxonPCs || !PCX || !PCY) return undefined;
    const xs = Object.entries(taxonPCs)
      .map(([taxon, PCs]) => ({ taxon, PC: PCs[PCX] ?? 0 }))
      .sort((a, b) => a.PC - b.PC);
    const ys = Object.entries(taxonPCs)
      .map(([taxon, PCs]) => ({ taxon, PC: PCs[PCY] ?? 0 }))
      .sort((a, b) => a.PC - b.PC);
    return [
      {
        className: "col-start-3",
        label: (
          <>
            <ArrowUpIcon />
            Top-most taxa
          </>
        ),
        header: PCY,
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
        header: PCX,
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
        header: PCX,
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
        header: PCY,
        data: ys.slice(0, count),
      },
    ];
  }, [taxonPCs, PCX, PCY]);

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
                {data.map(({ taxon, PC }, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>{taxon.split("|").join(" | ")}</td>
                    <td>{PC.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}

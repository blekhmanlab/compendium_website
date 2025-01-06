import {
  useState,
  type CSSProperties,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import Button from "@/components/Button";
import { preserveScroll } from "@/util/dom";
import { formatNumber } from "@/util/string";

export type Col<Datum extends object, Key extends keyof Datum> = {
  /** key of row object to access as cell value */
  key: Key;
  /** label for header */
  name: string;
  /** custom render function for cell */
  render?: (cell: NoInfer<Datum[Key]>, row: Datum) => ReactNode;
  /** cell style */
  style?: (cell?: NoInfer<Datum[Key]>, row?: Datum) => CSSProperties;
};

type Props<Datum extends object> = {
  /** col definitions https://github.com/orgs/vuejs/discussions/8851 */
  cols: { [Key in keyof Datum]: Col<Datum, Key> }[keyof Datum][];
  /** data */
  rows: Datum[];
  /** max rows to show at a time */
  limit?: number;
  /** extra rows to add at end, for messages */
  extraRows?: string[];
};

const Table = <Datum extends object>({
  cols,
  rows,
  limit = 10,
  extraRows,
}: Props<Datum>) => {
  const [slice, setSlice] = useState(limit);

  return (
    <>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {cols.map((col, index) => (
                <th key={index} style={col.style ? col.style() : {}}>
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!!rows.length &&
              rows.slice(0, slice).map((row, index) => (
                <tr key={index}>
                  {cols.map((col, index) => {
                    const cell = row[col.key];
                    return (
                      <td
                        key={index}
                        style={col.style ? col.style(cell, row) : {}}
                      >
                        {col.render
                          ? col.render(cell, row)
                          : typeof cell === "number"
                            ? formatNumber(cell, false)
                            : String(cell).split("_").join(" ")}
                      </td>
                    );
                  })}
                </tr>
              ))}

            {!!extraRows?.length &&
              extraRows.filter(Boolean).map((row, index) => (
                <tr key={index} style={{ opacity: 0.5 }}>
                  <td colSpan={cols.length}>{row}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {rows.length > slice && (
        <Button
          onClick={
            ((event) => {
              setSlice(slice + 10 * limit);
              preserveScroll(event.currentTarget);
            }) satisfies MouseEventHandler<HTMLButtonElement>
          }
        >
          Show More
        </Button>
      )}
    </>
  );
};

export default Table;

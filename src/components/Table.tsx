import {
  useState,
  type CSSProperties,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { clamp } from "lodash";
import AngleIcon from "@/assets/angle.svg?react";
import Button from "@/components/Button";
import CheckButton from "@/components/CheckButton";
import { preserveScroll } from "@/util/dom";
import { formatNumber } from "@/util/string";
import classes from "./Table.module.css";

type DatumShape = object & { name: string };

export type Col<Datum extends DatumShape, Key extends keyof Datum> = {
  /** key of row object to access as cell value */
  key: Key;
  /** label for header */
  name: string;
  /** custom render function for cell */
  render?: (cell: NoInfer<Datum[Key]>, row: Datum) => ReactNode;
  /** cell style */
  style?: (cell?: NoInfer<Datum[Key]>, row?: Datum) => CSSProperties;
};

type Props<Datum extends DatumShape> = {
  /** col definitions https://github.com/orgs/vuejs/discussions/8851 */
  cols: { [Key in keyof Datum]: Col<Datum, Key> }[keyof Datum][];
  /** data */
  rows: Datum[];
  /** max rows to show at a time */
  limit?: number;
  /** extra rows to add at end, for messages */
  extraRows?: string[];
  /** when selected rows change */
  onSelect?: (selected: string[]) => void;
};

export type OnSelect = NonNullable<Props<DatumShape>["onSelect"]>;
export type SelectedRows = Parameters<OnSelect>[0];

const Table = <Datum extends DatumShape>({
  cols,
  rows,
  limit = 7,
  extraRows,
  onSelect,
}: Props<Datum>) => {
  /** row cutoff */
  let [cutoff, setCutoff] = useState(limit);

  /** limit cutoff */
  cutoff = clamp(cutoff, limit, limit * Math.ceil(rows.length / limit));

  /** whether to show more/less buttons */
  const less = cutoff - limit >= limit;
  const more = cutoff < rows.length;

  /** selected rows */
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /** are rows selectable */
  const selectEnabled = !!onSelect;

  /** are some rows selected */
  const someSelected =
    !!rows.length && rows.some((row) => selected.has(row.name));

  /** set selected */
  const updateSelected = (newSelected: typeof selected) => {
    onSelect?.([...newSelected]);
    setSelected(newSelected);
  };

  return (
    <>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {selectEnabled && (
                <th>
                  <CheckButton
                    label={
                      someSelected
                        ? `Deselect ${formatNumber(selected.size)} rows`
                        : `Select ${formatNumber(rows.length)} rows`
                    }
                    checked={someSelected}
                    onChange={() =>
                      updateSelected(
                        someSelected
                          ? new Set()
                          : new Set(rows.map((row) => row.name)),
                      )
                    }
                  />
                </th>
              )}
              {cols.map((col, index) => (
                <th key={index} style={col.style ? col.style() : {}}>
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!!rows.length &&
              rows.slice(0, cutoff).map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  style={{ cursor: selectEnabled ? "pointer" : "" }}
                  onClick={
                    onSelect &&
                    ((event) =>
                      event.currentTarget.querySelector("button")?.click())
                  }
                >
                  {selectEnabled && (
                    <td>
                      <CheckButton
                        label={
                          selected.has(row.name) ? "Deselect row" : "Select row"
                        }
                        checked={selected.has(row.name)}
                        onChange={(checked) => {
                          const newSelected = new Set(selected);
                          if (checked) newSelected.add(row.name);
                          else newSelected.delete(row.name);
                          updateSelected(newSelected);
                        }}
                      />
                    </td>
                  )}
                  {cols.map((col, colIndex) => {
                    const cell = row[col.key];
                    return (
                      <td
                        key={colIndex}
                        style={col.style ? col.style(cell, row) : {}}
                      >
                        {col.render
                          ? col.render(cell, row)
                          : typeof cell === "number"
                            ? formatNumber(cell, false)
                            : String(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}

            {!!extraRows?.length &&
              extraRows.map((row, index) => (
                <tr key={index} style={{ opacity: 0.5 }}>
                  <td colSpan={cols.length}>{row}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className={classes.buttons}>
        {less && (
          <Button
            onClick={
              ((event) => {
                setCutoff(cutoff - limit);
                preserveScroll(event.currentTarget.parentElement);
              }) satisfies MouseEventHandler<HTMLButtonElement>
            }
          >
            <AngleIcon style={{ scale: "1 -1" }} />
            Less
          </Button>
        )}
        {more && (
          <Button
            onClick={
              ((event) => {
                setCutoff(cutoff + limit);
                preserveScroll(event.currentTarget.parentElement);
              }) satisfies MouseEventHandler<HTMLButtonElement>
            }
          >
            <AngleIcon />
            More
          </Button>
        )}
      </div>
    </>
  );
};

export default Table;

import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { useState } from "react";
import { clamp } from "lodash";
import { ChevronDownIcon } from "lucide-react";
import Button from "@/components/Button";
import CheckButton from "@/components/CheckButton";
import { preserveScroll } from "@/util/dom";
import { formatNumber } from "@/util/string";

type DatumShape = object & { name: string };

export type Column<Datum extends DatumShape, Key extends keyof Datum> = {
  /** key of row object to access as cell value */
  key: Key;
  /** label for header */
  name: string;
  /** custom render function for cell */
  render?: (cell: NoInfer<Datum[Key]>, row: Datum) => ReactNode;
  /** cell style */
  style?: (cell?: NoInfer<Datum[Key]>, row?: Datum) => CSSProperties;
};

/**
 * https://stackoverflow.com/questions/68274805/typescript-reference-type-of-property-by-other-property-of-same-object
 * https://github.com/vuejs/core/discussions/8851
 */
type _Column<Datum extends DatumShape> = {
  [Key in keyof Datum]: Column<Datum, Key extends keyof Datum ? Key : never>;
}[keyof Datum];

type Props<Datum extends DatumShape> = {
  /** column definitions */
  columns: _Column<Datum>[];
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

export default function Table<Datum extends DatumShape>({
  columns,
  rows,
  limit = 7,
  extraRows,
  onSelect,
}: Props<Datum>) {
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
      <div className="w-full table-wrapper">
        <table>
          <thead>
            <tr>
              {selectEnabled && (
                <th>
                  <CheckButton
                    tooltip={
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
              {columns.map((column, index) => (
                <th key={index} style={column.style ? column.style() : {}}>
                  {column.name}
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
                        className="border border-light-gray"
                        tooltip={
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
                  {columns.map((column, columnIndex) => {
                    const cell = row[column.key];
                    return (
                      <td
                        key={columnIndex}
                        style={column.style ? column.style(cell, row) : {}}
                      >
                        {column.render
                          ? column.render(cell, row)
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
                  <td colSpan={columns.length}>{row}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4">
        {less && (
          <Button
            onClick={
              ((event) => {
                setCutoff(cutoff - limit);
                preserveScroll(event.currentTarget.parentElement);
              }) satisfies MouseEventHandler<HTMLButtonElement>
            }
          >
            <ChevronDownIcon style={{ scale: "1 -1" }} />
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
            <ChevronDownIcon />
            More
          </Button>
        )}
      </div>
    </>
  );
}

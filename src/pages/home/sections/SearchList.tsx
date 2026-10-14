import type { Remote } from "comlink";
import type { Column } from "@/components/Table";
import type { Data } from "@/pages/home/state";
import type * as SearchAPI from "@/util/search";
import type { KeysOfType } from "@/util/types";
import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "@reactuses/core";
import { capitalize, upperFirst } from "lodash";
import Alert from "@/components/Alert";
import Select from "@/components/Select";
import Table from "@/components/Table";
import Textbox from "@/components/Textbox";
import SearchWorker from "@/util/search?worker";
import { formatNumber } from "@/util/string";
import { useWorker } from "@/util/worker";

type StateSearchList = Data[KeysOfType<Data, `${string}Search`>];

type Props<Data extends StateSearchList = StateSearchList> = {
  name: string;
  list: Data;
  filter?: (entry: NonNullable<Data>[number]) => boolean;
  columns: string[];
  types?: string[];
  onSelect?: (selected: string[]) => void;
};

/** fields to search on each list object */
const fields = ["name", "value"];

export default function SearchList({
  name,
  list,
  filter,
  columns,
  types,
  onSelect,
}: Props) {
  /** type filter */
  const [type, setType] = useState("All");

  /** search input */
  const [_search, setSearch] = useState("");
  /** debounced search input */
  const search = useDebounce(_search, 300);

  /** anything to search for */
  const hasSearch = !!search.trim();

  /** types specified */
  const hasTypes = !!types?.length;

  /** filter full search list by type */
  const filtered = useMemo(() => {
    if (!list) return [];
    let filtered = [...list];
    /** filter by type */
    if (hasTypes && type !== "All")
      filtered = filtered.filter((entry) =>
        "type" in entry ? entry.type === type : true,
      );
    /** filter by func */
    if (filter) filtered = filtered.filter(filter);
    return filtered;
  }, [list, hasTypes, type, filter]);

  type Filtered = NonNullable<typeof filtered>;

  const exactSearch = useCallback(
    (worker: Remote<typeof SearchAPI>) =>
      worker.exactSearch(filtered ?? [], fields, search) as Promise<Filtered>,
    [filtered, search],
  );
  const fuzzySearch = useCallback(
    (worker: Remote<typeof SearchAPI>) =>
      worker.fuzzySearch(filtered ?? [], fields, search) as Promise<Filtered>,
    [filtered, search],
  );

  /** exact search results */
  const [exactMatches = [], exactStatus] = useWorker(
    SearchWorker,
    /** skip work when search empty */
    hasSearch ? exactSearch : undefined,
  );
  /** fuzzy search results */
  const [fuzzyMatches = [], fuzzyStatus] = useWorker(
    SearchWorker,
    /** skip work when search empty */
    hasSearch ? fuzzySearch : undefined,
  );

  /** exact match name quick lookup */
  const exactLookup = useMemo(
    () => Object.fromEntries(exactMatches.map((match) => [match.name, ""])),
    [exactMatches],
  );

  if (!list)
    return (
      <Alert type="loading" className="aspect-3/1 w-full">
        Loading {name.toLowerCase()}
      </Alert>
    );

  /** full list of matches */
  const matches = search.trim()
    ? exactMatches.concat(
        /** de-duplicate items already in exact */
        fuzzyMatches
          .filter((fuzzy) => !(fuzzy.name in exactLookup))
          .map((fuzzy) => ({ ...fuzzy, fuzzy: true })),
      )
    : filtered;

  return (
    <>
      <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-4">
        <Textbox
          value={_search}
          onChange={setSearch}
          placeholder="Search"
          className={
            exactStatus === "loading" || fuzzyStatus === "loading"
              ? "animate-pulse"
              : ""
          }
        />

        {types && (
          <Select
            label="Type:"
            options={["All", ...types].map((value) => ({
              value,
              label: upperFirst(value),
            }))}
            value={type}
            onChange={setType}
          />
        )}

        <div>{formatNumber(matches.length)} items </div>
      </div>

      <Table
        columns={columns.map(
          (column): Column<Filtered[number], keyof Filtered[number]> => ({
            key: column as keyof Filtered[number],
            name: capitalize(column),
            style: (_, row) => ({ opacity: row?.fuzzy ? 0.5 : 1 }),
          }),
        )}
        rows={matches}
        extraRows={
          exactStatus !== "loading" &&
          fuzzyStatus !== "loading" &&
          !matches.length
            ? ["No results"]
            : undefined
        }
        onSelect={onSelect}
      />
    </>
  );
}

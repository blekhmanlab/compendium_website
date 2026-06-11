import type { Remote } from "comlink";
import type { Col } from "@/components/Table";
import type { Data } from "@/pages/home/state";
import type * as SearchAPI from "@/util/search.ts";
import type { KeysOfType } from "@/util/types";
import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "@reactuses/core";
import { capitalize } from "lodash";
import Select from "@/components/Select";
import Table from "@/components/Table";
import Textbox from "@/components/Textbox";
import SearchWorker from "@/util/search.ts?worker";
import { formatNumber } from "@/util/string";
import { useWorker } from "@/util/worker";

/** type options, including all */
type TypesAll = ("All" | NonNullable<Props["types"]>[number])[];

type List = NonNullable<Data[KeysOfType<Data, `${string}Search`>]>;

type Props = {
  name: string;
  list?: List;
  cols: string[];
  types?: string[];
  names?: string[];
  onSelect?: (selected: string[]) => void;
};

/** fields to search on each list object */
const fields = ["name", "value"];

const SearchList = ({
  name,
  list: fullList,
  cols,
  types,
  names,
  onSelect,
}: Props) => {
  /** type filter */
  const [type, setType] = useState<TypesAll[number]>("All");

  /** search input */
  const [_search, setSearch] = useState("");
  /** debounced search input */
  const search = useDebounce(_search, 300);

  /** filter full search list by type */
  const list = useMemo(() => {
    if (!fullList) return;
    let list = [...fullList];
    /** filter by type */
    if (types?.length && type !== "All")
      list = list.filter((entry) =>
        "type" in entry ? entry.type === type : true,
      );
    /** filter by name */
    if (names) list = list.filter((entry) => names.includes(entry.name));
    return list;
  }, [fullList, types, type, names]);

  /** exact search results */
  const [exactMatches = [], exactStatus] = useWorker(
    SearchWorker,
    useCallback(
      (worker: Remote<typeof SearchAPI>) =>
        worker.exactSearch(list ?? [], fields, search) as Promise<List>,
      [list, search],
    ),
  );
  /** fuzzy search results */
  const [fuzzyMatches = [], fuzzyStatus] = useWorker(
    SearchWorker,
    useCallback(
      (worker: Remote<typeof SearchAPI>) =>
        worker.fuzzySearch(list ?? [], fields, search) as Promise<List>,
      [list, search],
    ),
  );

  /** exact match name quick lookup */
  const exactLookup = useMemo(
    () => Object.fromEntries(exactMatches.map((match) => [match.name, ""])),
    [exactMatches],
  );

  if (!list)
    return (
      <div className="placeholder aspect-3/2">Loading {name.toLowerCase()}</div>
    );

  /** full list of matches */
  const matches = search.trim()
    ? exactMatches.concat(
        /** de-duplicate items already in exact */
        fuzzyMatches
          .filter((fuzzy) => !(fuzzy.name in exactLookup))
          .map((fuzzy) => ({ ...fuzzy, fuzzy: true })),
      )
    : list;

  type Datum = (typeof matches)[number];

  return (
    <>
      <div
        className="
          flex w-full min-w-0 flex-wrap items-center justify-center gap-4
        "
      >
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
            options={["All", ...types] as const}
            value={type}
            onChange={setType}
          />
        )}

        <div>{formatNumber(matches.length)} items </div>
      </div>

      <Table
        cols={cols.map(
          (col): Col<Datum, keyof Datum> => ({
            key: col as keyof (typeof matches)[number],
            name: capitalize(col),
            style: (_, row) => ({
              opacity: row?.fuzzy ? 0.5 : 1,
            }),
          }),
        )}
        rows={matches}
        extraRows={
          exactStatus !== "loading" &&
          fuzzyStatus !== "loading" &&
          !matches.length
            ? ["", "No results", ""]
            : undefined
        }
        onSelect={onSelect}
      />
    </>
  );
};

export default SearchList;

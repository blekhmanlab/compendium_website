import { useCallback, useMemo, useState } from "react";
import { capitalize } from "lodash";
import { useDebounce } from "@reactuses/core";
import LoadingIcon from "@/assets/loading.svg?react";
import Placeholder from "@/components/Placeholder";
import Select from "@/components/Select";
import Table, { type Col } from "@/components/Table";
import Textbox from "@/components/Textbox";
import type { Data } from "@/pages/home/data";
import { formatNumber } from "@/util/string";
import type { KeysOfType } from "@/util/types";
import { useThread } from "@/workers";
import classes from "./SearchList.module.css";

/** type options, including all */
type TypesAll = ("All" | NonNullable<Props["types"]>[number])[];

type List = NonNullable<Data[KeysOfType<Data, `${string}Search`>]>;

type Props = {
  list?: List;
  cols: string[];
  types?: string[];
  names?: string[];
  onSelect?: (selected: string[]) => void;
};

const Search = ({ list: fullList, cols, types, names, onSelect }: Props) => {
  /** local state */
  const [type, setType] = useState<TypesAll[number]>("All");
  const [_search, setSearch] = useState("");
  const search = useDebounce(_search, 300);

  /** filter full search list by type */
  const list = useMemo(() => {
    if (!fullList) return undefined;

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

  /** exact search */
  const [exactMatches = [], exactStatus] = useThread(
    useCallback(
      (worker) => {
        if (!(list && search.trim())) return;
        return worker.exactSearch(list, ["name", "value"], search);
      },
      [list, search],
    ),
  );

  /** fuzzy search */
  const [fuzzyMatches = [], fuzzyStatus] = useThread(
    useCallback(
      (worker) => {
        if (!(list && search.trim())) return;
        return worker.fuzzySearch(list, ["name", "value"], search);
      },
      [list, search],
    ),
  );

  /** exact match name quick lookup */
  const exactMatchLookup = useMemo(
    () => Object.fromEntries(exactMatches.map((match) => [match.name, ""])),
    [exactMatches],
  );

  if (!list) return <Placeholder height={400}>Loading search...</Placeholder>;

  /** full list of matches */
  const matches = search.trim()
    ? exactMatches.concat(
        /** de-duplicate items already in exact */
        fuzzyMatches
          .filter((fuzzy) => !(fuzzy.name in exactMatchLookup))
          .map((fuzzy) => ({ ...fuzzy, fuzzy: true })),
      )
    : list;

  type Datum = (typeof matches)[number];

  return (
    <>
      <div className={classes.search}>
        <div className={classes.box}>
          <LoadingIcon
            style={{
              opacity:
                exactStatus === "loading" || fuzzyStatus === "loading" ? 1 : 0,
            }}
          />
          <Textbox value={_search} onChange={setSearch} placeholder="Search" />
        </div>

        {types && (
          <Select
            label="Type:"
            options={["All", ...types] as const}
            value={type}
            onChange={setType}
          />
        )}

        <div style={{ width: 100 }}>{formatNumber(matches.length)} items </div>
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

export default Search;

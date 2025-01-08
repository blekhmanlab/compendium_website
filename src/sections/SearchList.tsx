import { useEffect, useMemo, useState } from "react";
import { capitalize } from "lodash";
import { useDebounce } from "@reactuses/core";
import Placeholder from "@/components/Placeholder";
import Select from "@/components/Select";
import Table, { type Col } from "@/components/Table";
import Textbox from "@/components/Textbox";
import type { Data } from "@/data";
import type { KeysOfType } from "@/util/types";
import { thread } from "@/workers";
import classes from "./SearchList.module.css";

/** filters options, including all */
type FiltersAll = ("All" | NonNullable<Props["filters"]>[number])[];

type List = Data[KeysOfType<Data, `${string}Search`>];

type Props = {
  list: List;
  cols: string[];
  filters?: string[];
};

const Search = ({ list: fullList, cols, filters }: Props) => {
  /** local state */
  const [filter, setFilter] = useState<FiltersAll[number]>("All");
  const [_search, setSearch] = useState("");
  const search = useDebounce(_search, 300);
  const [exactMatches, setExactMatches] = useState<NonNullable<List>>([]);
  const [exactSearching, setExactSearching] = useState(false);
  const [fuzzyMatches, setFuzzyMatches] = useState<NonNullable<List>>([]);
  const [fuzzySearching, setFuzzySearching] = useState(false);

  /** filter full search list before any other steps */
  const list = useMemo(
    () =>
      filters
        ? fullList?.filter((entry) =>
            !("type" in entry)
              ? true
              : entry.type === filter || filter === "All"
                ? filters.includes(entry.type)
                : false,
          )
        : fullList,
    [filters, filter, fullList],
  );

  /** exact search */
  useEffect(() => {
    let latest = true;

    if (list && search.trim()) {
      setExactMatches([]);
      setExactSearching(true);

      /** do in worker to not freeze UI */
      thread((worker) => worker.exactSearch(list, ["name", "value"], search))
        .then((result) => {
          /** if not latest run of use effect (superseded), ignore result */
          if (!latest) return;

          setExactMatches(result as typeof exactMatches);
        })
        .catch(console.error)
        .finally(() => {
          setExactSearching(false);
        });
    }

    return () => {
      latest = false;
      setExactSearching(false);
    };
  }, [list, search, setExactSearching]);

  /** fuzzy search */
  useEffect(() => {
    let latest = true;

    if (list && search.trim()) {
      setFuzzyMatches([]);
      setFuzzySearching(true);

      /** do in worker to not freeze UI */
      thread((worker) => worker.fuzzySearch(list, ["name", "value"], search))
        .then((result) => {
          /** if not latest run of use effect (superseded), ignore result */
          if (!latest) return;

          setFuzzyMatches(result as typeof fuzzyMatches);
        })
        .catch(console.error)
        .finally(() => {
          setFuzzySearching(false);
        });
    }

    return () => {
      latest = false;
      setFuzzySearching(false);
    };
  }, [list, search, setFuzzySearching]);

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
        <Textbox value={_search} onChange={setSearch} placeholder="Search" />
        {filters && (
          <Select
            label="Type:"
            options={["All", ...filters] as const}
            value={filter}
            onChange={setFilter}
          />
        )}
      </div>

      <Table
        cols={cols.map(
          (col, index): Col<Datum, keyof Datum> => ({
            key: col as keyof (typeof matches)[number],
            name: capitalize(col),
            style: (_, row) => ({
              opacity: row?.fuzzy ? 0.5 : 1,
              width: index === 0 ? "100%" : undefined,
            }),
          }),
        )}
        rows={matches}
        extraRows={[
          exactSearching ? "Searching for exact matches..." : "",
          fuzzySearching ? "Searching for close matches..." : "",
          !exactSearching && !fuzzySearching && !matches.length
            ? "No results"
            : "",
        ]}
      />
    </>
  );
};

export default Search;

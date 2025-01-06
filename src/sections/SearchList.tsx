import { useEffect, useMemo, useState } from "react";
import { capitalize } from "lodash";
import Placeholder from "@/components/Placeholder";
import Select from "@/components/Select";
import Table, { type Col } from "@/components/Table";
import Textbox from "@/components/Textbox";
import { Data } from "@/data";
import { thread } from "@/workers";
import classes from "./SearchList.module.css";

/** filters options, including all */
type FiltersAll = ("All" | Props["filters"][number])[];

type List = NonNullable<
  | Data["metaSearchList"]
  | Data["taxaSearchList"]
  | Data["tagSearchList"]
  | Data["tagValueSearchList"]
>;

type Props = {
  list: List;
  cols: string[];
  filters: string[];
};

const Search = ({ list: fullList, cols, filters }: Props) => {
  /** local state */
  const [search, setSearch] = useState("");
  const [fuzzy, setFuzzy] = useState<List>([]);
  const [fuzzySearching, setFuzzySearching] = useState(false);
  const [filter, setFilter] = useState<FiltersAll[number]>("All");

  /** filter full search list before any other steps */
  const searchList = useMemo(
    () =>
      fullList?.filter((entry) =>
        !("type" in entry)
          ? true
          : entry.type === filter || filter === "All"
            ? filters.includes(entry.type)
            : false,
      ),
    [filters, filter, fullList],
  );

  /** get fuzzy (trigram) matches (in worker to not freeze ui) */
  useEffect(() => {
    let latest = true;

    /** reset fuzzy */
    setFuzzy([]);

    if (searchList && search.trim()) {
      setFuzzySearching(true);
      /** fuzzy search then set recommendations */
      thread((worker) => worker.fuzzySearch(searchList, "name", search)).then(
        (fuzzy) => {
          /** if not latest run of use effect (superseded), ignore result */
          if (!latest) return;

          setFuzzy(fuzzy as List);
          setFuzzySearching(false);
        },
      );
    } else setFuzzy([]);

    return () => {
      latest = false;
      setFuzzySearching(false);
    };
  }, [searchList, search]);

  if (!searchList)
    return <Placeholder height={400}>Loading search...</Placeholder>;

  /** get exact matches */
  const exact = (searchList || []).filter((entry) =>
    (entry.name + ("value" in entry ? entry.value : ""))
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  /** full list of matches */
  const matches = exact.concat(
    /** de-duplicate items already in exact */
    fuzzy
      .filter((fuzzy) => !exact.find((result) => result.name === fuzzy.name))
      .map((fuzzy) => ({ ...fuzzy, fuzzy: true })),
  );

  type Datum = (typeof matches)[number];

  return (
    <>
      <div className={classes.search}>
        <Textbox value={search} onChange={setSearch} placeholder="Search" />
        {filters.length > 1 && (
          <Select
            label="Type:"
            options={["All", ...filters] as FiltersAll}
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
          fuzzySearching
            ? "... fuzzy searching ..."
            : !matches.length
              ? "No Results"
              : "",
        ]}
      />
    </>
  );
};

export default Search;

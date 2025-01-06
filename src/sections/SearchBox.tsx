import { useEffect, useMemo, useState } from "react";
import Placeholder from "@/components/Placeholder";
import Select from "@/components/Select";
import Table from "@/components/Table";
import Textbox from "@/components/Textbox";
import { Data, SearchList, useData } from "@/data";
import { formatNumber } from "@/util/string";
import { thread } from "@/workers";
import classes from "./SearchBox.module.css";

/** filter options, from search list types */
type Filters = NonNullable<Data["searchList"]>[number]["type"][];
/** filters options, including all */
type FiltersAll = ("All" | Props["filters"][number])[];

type Props = {
  filters: Filters;
};

const Search = ({ filters }: Props) => {
  /** get global state */
  const fullSearchList = useData((state) => state.searchList);

  /** local state */
  const [search, setSearch] = useState("");
  const [fuzzy, setFuzzy] = useState<SearchList>([]);
  const [filter, setFilter] = useState<FiltersAll[number]>("All");

  /** filter full search list before any other steps */
  const searchList = useMemo(
    () =>
      fullSearchList?.filter((entry) =>
        entry.type === filter || filter === "All"
          ? filters.includes(entry.type)
          : false,
      ),
    [filters, filter, fullSearchList],
  );

  /** get fuzzy (trigram) matches (in worker to not freeze ui) */
  useEffect(() => {
    let latest = true;

    /** reset fuzzy */
    setFuzzy([]);

    if (searchList && search.trim())
      /** fuzzy search then set recommendations */
      thread((worker) => worker.fuzzySearch(searchList, "name", search)).then(
        (fuzzy) => {
          /** if not latest run of use effect (superseded), ignore result */
          if (latest) setFuzzy(fuzzy as SearchList);
        },
      );
    else setFuzzy([]);

    return () => {
      latest = false;
    };
  }, [searchList, search]);

  if (!searchList)
    return <Placeholder height={400}>Loading search...</Placeholder>;

  /** get exact matches */
  const exact = (searchList || []).filter((entry) =>
    entry.name.toLowerCase().includes(search.toLowerCase()),
  );

  /** full list of matches */
  const matches = exact.concat(
    /** de-duplicate items already in exact */
    fuzzy
      .filter((fuzzy) => !exact.find((result) => result.name === fuzzy.name))
      .map((fuzzy) => ({ ...fuzzy, fuzzy: true })),
  );

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
        cols={[
          {
            key: "name",
            name: "Name",
            render: (cell) => cell.split("_").join(" "),
            style: (_, row) => ({
              opacity: row?.fuzzy ? 0.5 : 1,
              width: "100%",
            }),
          },
          !filters.includes("Tag")
            ? {
                key: "type",
                name: "Type",
                style: (_, row) => ({
                  opacity: row?.fuzzy ? 0.5 : 1,
                }),
              }
            : {
                key: "projects",
                name: "Projects",
                render: (cell) => formatNumber(cell, false),
                style: (_, row) => ({
                  opacity: row?.fuzzy ? 0.5 : 1,
                }),
              },
          {
            key: "samples",
            name: "Samples",
            render: (cell) => formatNumber(cell, false),
            style: (_, row) => ({ opacity: row?.fuzzy ? 0.5 : 1 }),
          },
        ]}
        rows={matches}
      />
    </>
  );
};

export default Search;

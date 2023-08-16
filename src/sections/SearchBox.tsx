import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Select from "@/components/Select";
import Textbox from "@/components/Textbox";
import { Data, SearchList, useData } from "@/data";
import { thread } from "@/workers";
import classes from "./SearchBox.module.css";

type Filters = NonNullable<Data["searchList"]>[number]["type"][];
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
  const [limit, setLimit] = useState(10);

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

  /** get exact matches */
  const exact = (searchList || []).filter((entry) =>
    entry.name.toLowerCase().includes(search.toLowerCase()),
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

  /** full list of matches */
  const matches = exact.concat(
    /** de-duplicate items already in exact */
    fuzzy
      .filter((fuzzy) => !exact.find((result) => result.name === fuzzy.name))
      .map((fuzzy) => ({ ...fuzzy, fuzzy: true })),
  );

  /** reset limit when search changes */
  useEffect(() => {
    setLimit(10);
  }, [search]);

  return (
    <>
      <div className={classes.search}>
        <Textbox value={search} onChange={setSearch} placeholder="Search" />
        <Select
          label="Filter by type:"
          options={["All", ...filters] as FiltersAll}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <div className="table-wrapper">
        <table className={classes.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Samples</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td colSpan={3}>{/* spacer */}</td>
            </tr>

            {matches.length ? (
              matches
                .slice(0, limit)
                .map(({ name, type, samples, fuzzy }, index) => (
                  <tr key={index} style={{ opacity: fuzzy ? 0.5 : 1 }}>
                    <td>{name}</td>
                    <td>{type}</td>
                    <td>{samples.toLocaleString()}</td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan={3}>No results</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {matches.length > limit && (
        <Button onClick={() => setLimit(limit + 10)}>Show More</Button>
      )}
    </>
  );
};

export default Search;

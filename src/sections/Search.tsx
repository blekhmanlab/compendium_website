import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Select from "@/components/Select";
import Textbox from "@/components/Textbox";
import { SearchList, useData } from "@/data";
import { thread } from "@/workers";
import classes from "./Search.module.css";

const filters = [
  "All",
  "Project",
  "Sample",
  "Phylum",
  "Class",
  "Country",
  "Region",
];

const Search = () => {
  const [search, setSearch] = useState("");
  const [fuzzy, setFuzzy] = useState<SearchList>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]>(filters[0]);
  const [limit, setLimit] = useState(10);

  const fullSearchList = useData((state) => state.searchList);

  /** filter full search list before any other steps */
  const searchList = useMemo(
    () =>
      fullSearchList?.filter(
        (entry) => filter === "All" || entry.type === filter,
      ),
    [filter, fullSearchList],
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
      <p>
        Does this dataset have what you're looking for? Search for a{" "}
        <span data-tooltip="Collection of multiple samples, by <a href='https://www.ncbi.nlm.nih.gov/bioproject/'>BioProject</a> accession">
          project
        </span>
        ,{" "}
        <span data-tooltip="Individual sample, by <a href='https://www.ncbi.nlm.nih.gov/sra'>SRA</a> run accession">
          sample
        </span>
        , <span data-tooltip="Taxon observed in sample">phylum</span>,{" "}
        <span data-tooltip="Taxon observed in sample">class</span>,{" "}
        <span data-tooltip="Geographic origin of samples, based on <a href='https://www.naturalearthdata.com/'>Natural Earth</a> data">
          country
        </span>
        , or{" "}
        <span data-tooltip="Geographic origin of samples, grouped by <a href='https://unstats.un.org/sdgs/indicators/regional-groups/'>SDG Regions</a>">
          region
        </span>{" "}
        to find it in the dataset and see how many samples are present in it.
      </p>

      <div className={classes.search}>
        <Textbox value={search} onChange={setSearch} placeholder="Search" />
        <Select
          label="Filter by type:"
          options={filters}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th style={{ width: "100px" }}>Type</th>
              <th style={{ width: "100px" }}>Samples</th>
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
                  <tr key={index} style={{ opacity: fuzzy ? 0.75 : 1 }}>
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

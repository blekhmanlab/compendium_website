import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Textbox from "@/components/Textbox";
import { useData } from "@/data";
import { thread } from "@/workers";

/** list of search entries or exact */
type List = { name: string; type: string; samples: number; fuzzy?: boolean }[];

const Search = () => {
  const [search, setSearch] = useState("");
  const [fuzzy, setFuzzy] = useState<List>([]);
  const [limit, setLimit] = useState(10);
  const byClass = useData((state) => state.byClass);
  const byPhylum = useData((state) => state.byPhylum);
  const byCountry = useData((state) => state.byCountry);
  const byRegion = useData((state) => state.byRegion);
  const byProject = useData((state) => state.byProject);

  /** collate all data into single list of entries to search. can't do this as
   * compile pre-process because file ends up being very large. */
  const list: List = useMemo(() => {
    if (!byClass || !byPhylum || !byCountry || !byRegion || !byProject)
      return [];

    /** collect complete list */
    const list: List = [];

    /** include classes */
    for (const { name, samples } of byClass)
      list.push({ type: "Class", name, samples });

    /** include phyla */
    for (const { name, samples } of byPhylum)
      list.push({ type: "Phylum", name, samples });

    /** include countries */
    for (const {
      properties: { name, samples },
    } of byCountry.features)
      list.push({ type: "Country", name, samples });

    /** include regions */
    for (const {
      properties: { region, samples },
    } of byRegion.features)
      list.push({ type: "Region", name: region, samples });

    /** include projects */
    for (const { project, samples } of byProject)
      list.push({
        type: "Project",
        name: project,
        samples: samples.length,
      });

    /** include samples */
    for (const { samples } of byProject)
      for (const sample of samples)
        list.push({ type: "Sample", name: sample, samples: 1 });

    /** sort by number of samples */
    list.sort((a, b) => b.samples - a.samples);

    return list;
  }, [byClass, byPhylum, byCountry, byRegion, byProject]);

  /** get exact matches */
  const exact = useMemo(
    () =>
      list.filter((entry) =>
        entry.name.toLowerCase().includes(search.toLowerCase())
      ),
    [list, search]
  );

  /** get fuzzy (trigram) matches (in worker to not freeze ui) */
  useEffect(() => {
    let latest = true;

    /** reset fuzzy */
    setFuzzy([]);

    if (search.trim())
      /** fuzzy search then set recommendations */
      thread((worker) => worker.fuzzySearch(list, "name", search)).then(
        (fuzzy) => {
          /** if not latest run of use effect (superseded), ignore result */
          if (latest) setFuzzy(fuzzy as List);
        }
      );
    else setFuzzy([]);

    return () => {
      latest = false;
    };
  }, [list, search, exact]);

  /** full list of matches */
  const matches = exact.concat(
    /** de-duplicate items already in exact */
    fuzzy
      .filter((fuzzy) => !exact.find((result) => result.name === fuzzy.name))
      .map((fuzzy) => ({ ...fuzzy, fuzzy: true }))
  );

  /** reset limit when search changes */
  useEffect(() => {
    setLimit(10);
  }, [search]);

  return (
    <>
      <p>
        Does this dataset have what you're looking for? Search for a project,
        sample, country, phylum, class, etc.
      </p>

      <Textbox value={search} onChange={setSearch} placeholder="Search" />

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

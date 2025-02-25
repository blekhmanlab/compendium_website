import {
  startTransition,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import Tabs from "@/components/Tabs";
import { loadTagData, useData } from "@/data";
import SearchList from "@/sections/SearchList";
import classes from "./Search.module.css";

export const tooltips = {
  project:
    "Collection of multiple samples, by <a href='https://www.ncbi.nlm.nih.gov/bioproject/' target='_blank'>BioProject</a> accession.",
  sample:
    "Individual sample, by <a href='https://www.ncbi.nlm.nih.gov/sra' target='_blank'>SRA</a> run accession.",
  country:
    "Geographic origin of samples, based on <a href='https://www.naturalearthdata.com/' target='_blank'>Natural Earth</a> country data.",
  region:
    "Geographic origin of samples, grouped into regions according to <a href='https://unstats.un.org/sdgs/indicators/regional-groups/' target='_blank'>the UN's Sustainable Development Goals</a>.",
  phylum: "Taxonomic phylum associated with sample.",
  class: "Taxonomic class associated with sample.",
  tag: "Piece of metadata associated with an individual sample.",
};

const Search = () => {
  /** get global state */
  const projectSearch = useData((state) => state.projectSearch);
  const geoSearch = useData((state) => state.geoSearch);
  const taxaSearch = useData((state) => state.taxaSearch);
  const tagSearch = useData((state) => state.tagSearch);
  const tagValueSearch = useData((state) => state.tagValueSearch);

  const [tab, setTab] = useState(0);

  useEffect(() => {
    /** load large data on demand */
    if (tab === 3 && !tagSearch) loadTagData();
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  return (
    <section
      style={{ "--col": tab === 3 ? "1200px" : undefined } as CSSProperties}
    >
      <h2>Search</h2>

      <Tabs
        onChange={setTab}
        tabs={[
          {
            name: "Geography",
            content: (
              <>
                <p>
                  Search for a{" "}
                  <span data-tooltip={tooltips["region"]}>region</span> or{" "}
                  <span data-tooltip={tooltips["country"]}>country</span> to see
                  how many samples are associated with it.
                </p>
                <SearchList
                  list={geoSearch}
                  cols={["name", "type", "samples"]}
                  types={["Country", "Region"]}
                />
              </>
            ),
          },
          {
            name: "Project/Sample",
            content: (
              <>
                <p>
                  Search for a{" "}
                  <span data-tooltip={tooltips["project"]}>project</span> or{" "}
                  <span data-tooltip={tooltips["sample"]}>sample</span>{" "}
                  accession to see how many samples are associated with it.
                </p>
                <SearchList
                  list={projectSearch}
                  cols={["name", "type", "samples"]}
                  types={["Project", "Sample"]}
                />
              </>
            ),
          },
          {
            name: "Taxa",
            content: (
              <>
                <p>
                  Search for a{" "}
                  <span data-tooltip={tooltips["phylum"]}>phylum</span> or{" "}
                  <span data-tooltip={tooltips["class"]}>class</span> to see how
                  many samples it's present in.
                </p>
                <SearchList
                  list={taxaSearch}
                  cols={["name", "type", "samples"]}
                  types={["Phylum", "Class"]}
                />
              </>
            ),
          },
          {
            name: "Tags",
            content: (
              <div className={classes.cols}>
                <div className="sub-section">
                  <p>
                    Search for a <span data-tooltip={tooltips["tag"]}>tag</span>{" "}
                    to see how many projects or samples have it. Select rows to
                    filter next table.
                  </p>
                  <SearchList
                    list={tagSearch}
                    cols={["name", "projects", "samples"]}
                    onSelect={(selected) =>
                      startTransition(() => setSelectedTags(selected))
                    }
                  />
                </div>
                <div className="sub-section">
                  <p>
                    Search for a name or value to see which projects and how
                    many samples have it.
                  </p>
                  <SearchList
                    list={tagValueSearch}
                    cols={["name", "value", "project", "samples"]}
                    names={selectedTags}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />
    </section>
  );
};

export default Search;

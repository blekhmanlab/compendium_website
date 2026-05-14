import { startTransition, useEffect, useState } from "react";
import clsx from "clsx";
import Tabs from "@/components/Tabs";
import { loadTags, useData } from "@/pages/home/state";
import SearchList from "./SearchList";

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

/** ensure only one load */
let loaded = false;

const Search = () => {
  /** get global state */
  const projectSearch = useData((state) => state.projectSearch);
  const geoSearch = useData((state) => state.geoSearch);
  const taxonSearch = useData((state) => state.taxonSearch);
  const tagSearch = useData((state) => state.tagSearch);
  const tagValueSearch = useData((state) => state.tagValueSearch);

  const [tab, setTab] = useState(0);

  useEffect(() => {
    /** load large data on demand */
    if (tab === 3 && !loaded) {
      loadTags();
      loaded = true;
    }
  }, [tab]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  return (
    <section className={clsx(tab === 3 && "width-lg")}>
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
                  name="Geography"
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
                  name="Project/Sample"
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
                  name="Taxa"
                  list={taxonSearch}
                  cols={["name", "type", "samples"]}
                  types={["Phylum", "Class"]}
                />
              </>
            ),
          },
          {
            name: "Tags",
            content: (
              <div
                className="
                  grid w-full
                  grid-cols-[repeat(auto-fit,minmax(min(400px,100%),1fr))]
                  gap-x-14 gap-y-10
                  *:flex *:flex-col *:items-center *:gap-8
                "
              >
                <div>
                  <p>
                    Search for a <span data-tooltip={tooltips["tag"]}>tag</span>{" "}
                    to see how many projects or samples have it. Select rows to
                    filter next table.
                  </p>
                  <SearchList
                    name="Tags"
                    list={tagSearch}
                    cols={["name", "projects", "samples"]}
                    onSelect={(selected) =>
                      startTransition(() => setSelectedTags(selected))
                    }
                  />
                </div>
                <div>
                  <p>
                    Search for a name or value to see which projects and how
                    many samples have it.
                  </p>
                  <SearchList
                    name="Tag Values"
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

import { useEffect } from "react";
import Tabs from "@/components/Tabs";
import {
  loadGeoData,
  loadProjectData,
  loadTagData,
  loadTaxaData,
  useData,
} from "@/data";
import SearchList from "@/sections/SearchList";

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

  const onChange = (index: number) => {
    /** load data on demand */
    switch (index) {
      case 0:
        if (!projectSearch) loadProjectData();
        break;
      case 1:
        if (!geoSearch) loadGeoData();
        break;
      case 2:
        if (!taxaSearch) loadTaxaData();
        break;
      case 3:
        if (!tagSearch) loadTagData();
        break;
    }
  };

  useEffect(() => {
    onChange(0);
  });

  return (
    <section>
      <h2>Search</h2>

      <p>Does this dataset have what you're looking for?</p>

      <Tabs
        onChange={onChange}
        tabs={[
          {
            name: "Project",
            description: (
              <>
                Search for a{" "}
                <span data-tooltip={tooltips["project"]}>project</span> or{" "}
                <span data-tooltip={tooltips["sample"]}>sample</span> to see how
                many samples are associated with it.
              </>
            ),
            content: (
              <SearchList
                list={projectSearch}
                cols={["name", "type", "samples"]}
                filters={["Project", "Sample"]}
              />
            ),
          },
          {
            name: "Geography",
            description: (
              <>
                Search for a{" "}
                <span data-tooltip={tooltips["region"]}>region</span> or{" "}
                <span data-tooltip={tooltips["country"]}>country</span> to see
                how many samples are associated with it.
              </>
            ),
            content: (
              <SearchList
                list={geoSearch}
                cols={["name", "type", "samples"]}
                filters={["Country", "Region"]}
              />
            ),
          },
          {
            name: "Taxa",
            description: (
              <>
                Search for a{" "}
                <span data-tooltip={tooltips["phylum"]}>phylum</span> or{" "}
                <span data-tooltip={tooltips["class"]}>class</span> to see how
                many samples it's present in.
              </>
            ),
            content: (
              <SearchList
                list={taxaSearch}
                cols={["name", "type", "samples"]}
                filters={["Phylum", "Class"]}
              />
            ),
          },
          {
            name: "Tags",
            description: (
              <>
                Search for a <span data-tooltip={tooltips["tag"]}>tag</span> to
                see how many samples/projects are tagged with it.
              </>
            ),
            content: (
              <>
                <SearchList
                  list={tagSearch}
                  cols={["name", "projects", "samples"]}
                />

                <p>Tag values:</p>
                <SearchList
                  list={tagValueSearch}
                  cols={["name", "value", "project", "samples"]}
                />
              </>
            ),
          },
        ]}
      />
    </section>
  );
};

export default Search;

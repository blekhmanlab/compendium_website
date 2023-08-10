import Tabs from "@/components/Tabs";
import SearchBox from "@/sections/SearchBox";

const Search = () => (
  <section>
    <h2>Search</h2>

    <Tabs
      tabs={[
        {
          name: "Metadata",
          description: (
            <p>
              Search for a{" "}
              <span data-tooltip="Collection of multiple samples, by <a href='https://www.ncbi.nlm.nih.gov/bioproject/' target='_blank'>BioProject</a> accession.">
                project
              </span>
              ,{" "}
              <span data-tooltip="Individual sample, by <a href='https://www.ncbi.nlm.nih.gov/sra' target='_blank'>SRA</a> run accession.">
                sample
              </span>
              ,{" "}
              <span data-tooltip="Geographic origin of samples, based on <a href='https://www.naturalearthdata.com/' target='_blank'>Natural Earth</a> country data.">
                country
              </span>
              , or{" "}
              <span data-tooltip="Geographic origin of samples, grouped into regions according to <a href='https://unstats.un.org/sdgs/indicators/regional-groups/' target='_blank'>the UN's Sustainable Development Goals</a>.">
                region
              </span>{" "}
              in the dataset.
            </p>
          ),
          content: (
            <SearchBox filters={["Project", "Sample", "Country", "Region"]} />
          ),
        },
        {
          name: "Taxa",
          description: <p>Search for a phylum or class in the dataset.</p>,
          content: <SearchBox filters={["Phylum", "Class"]} />,
        },
      ]}
    />
  </section>
);

export default Search;

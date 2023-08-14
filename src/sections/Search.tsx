import Tabs from "@/components/Tabs";
import SearchBox from "@/sections/SearchBox";

export const tooltips = {
  project:
    "Collection of multiple samples, by <a href='https://www.ncbi.nlm.nih.gov/bioproject/' target='_blank'>BioProject</a> accession.",
  sample:
    "Individual sample, by <a href='https://www.ncbi.nlm.nih.gov/sra' target='_blank'>SRA</a> run accession.",
  country:
    "Geographic origin of samples, based on <a href='https://www.naturalearthdata.com/' target='_blank'>Natural Earth</a> country data.",
  region:
    "Geographic origin of samples, grouped into regions according to <a href='https://unstats.un.org/sdgs/indicators/regional-groups/' target='_blank'>the UN's Sustainable Development Goals</a>.",
};

const Search = () => (
  <section>
    <h2>Search</h2>

    <Tabs
      tabs={[
        {
          name: "Metadata",
          description: (
            <>
              Does this dataset have what you're looking for? Search for a{" "}
              <span data-tooltip={tooltips["project"]}>project</span>,{" "}
              <span data-tooltip={tooltips["sample"]}>sample</span>,{" "}
              <span data-tooltip={tooltips["region"]}>region</span>, or{" "}
              <span data-tooltip={tooltips["country"]}>country</span> to see if
              we have it before you download.
            </>
          ),
          content: (
            <SearchBox filters={["Project", "Sample", "Country", "Region"]} />
          ),
        },
        {
          name: "Taxa",
          description: (
            <>
              Search for a phylum or class to see if it is present in the
              dataset.
            </>
          ),
          content: <SearchBox filters={["Phylum", "Class"]} />,
        },
      ]}
    />
  </section>
);

export default Search;

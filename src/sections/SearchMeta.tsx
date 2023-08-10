import Search from "@/sections/Search";

const SearchMeta = () => (
  <section>
    <h2>Search Metadata</h2>

    <p>
      Does this dataset have what you're looking for? Search for a{" "}
      <span data-tooltip="Collection of multiple samples, by <a href='https://www.ncbi.nlm.nih.gov/bioproject/'>BioProject</a> accession.">
        project
      </span>
      ,{" "}
      <span data-tooltip="Individual sample, by <a href='https://www.ncbi.nlm.nih.gov/sra'>SRA</a> run accession.">
        sample
      </span>
      ,{" "}
      <span data-tooltip="Geographic origin of samples, based on <a href='https://www.naturalearthdata.com/'>Natural Earth</a> country data.">
        country
      </span>
      , or{" "}
      <span data-tooltip="Geographic origin of samples, grouped into regions according to <a href='https://unstats.un.org/sdgs/indicators/regional-groups/'>the UN's Sustainable Development Goals</a>.">
        region
      </span>{" "}
      to find it in the dataset and see how many samples are present in it.
    </p>

    <Search filters={["Project", "Sample", "Country", "Region"]} />
  </section>
);

export default SearchMeta;

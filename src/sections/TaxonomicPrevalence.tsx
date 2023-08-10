import Cols from "@/components/Cols";
import { useData } from "@/data";
import TaxonomicChart from "@/sections/TaxonomicChart";

const TaxonomicPrevalence = () => {
  const byClass = useData((state) => state.byClass);
  const byPhylum = useData((state) => state.byPhylum);

  return (
    <section>
      <h2>Taxonomic Prevalence</h2>

      <Cols>
        <TaxonomicChart
          id="by-phylum"
          title="By Phylum"
          data={byPhylum}
          name="phylum"
        />
        <TaxonomicChart
          id="by-class"
          title="By Class"
          data={byClass}
          name="_class"
        />
      </Cols>
    </section>
  );
};

export default TaxonomicPrevalence;

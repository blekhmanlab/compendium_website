import Cols from "@/components/Cols";
import { loadData, useData } from "@/data";
import GeographicPrevalence from "@/sections/GeographicPrevalence";
import Header from "@/sections/Header";
import Hero from "@/sections/Hero";
import TaxonomicPrevalence from "@/sections/TaxonomicPrevalence";
import "@/components/tooltip";
import "./App.css";
import Recipes from "@/sections/Recipes";

loadData();

const App = () => {
  const byClass = useData((state) => state.byClass);
  const byPhyla = useData((state) => state.byPhyla);
  const byCountry = useData((state) => state.byCountry);
  const byRegion = useData((state) => state.byRegion);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <section>
          <h2>By Taxonomic Level</h2>
          <Cols>
            <TaxonomicPrevalence
              id="by-phylum"
              title="By Phylum"
              data={byPhyla?.slice(0, 20)}
            />
            <TaxonomicPrevalence
              id="by-class"
              title="By Class"
              data={byClass?.slice(0, 20)}
            />
          </Cols>
        </section>
        <section>
          <h2>By Geography</h2>
          <GeographicPrevalence
            id="map"
            title="By Geography"
            byCountry={byCountry}
            byRegion={byRegion}
          />
        </section>
        <section>
          <h2>Recipes</h2>
          <Recipes />
        </section>
      </main>
    </>
  );
};

export default App;

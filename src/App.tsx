import Cols from "@/components/Cols";
import { loadData, useData } from "@/data";
import GeographicPrevalence from "@/sections/GeographicPrevalence";
import Header from "@/sections/Header";
import Overview from "@/sections/Overview";
import TaxonomicPrevalence from "@/sections/TaxonomicPrevalence";
import "@/components/tooltip";
import "./App.css";
import Recipes from "@/sections/Recipes";
import Search from "@/sections/Search";

loadData();

const App = () => {
  const byClass = useData((state) => state.byClass);
  const byPhylum = useData((state) => state.byPhylum);
  const byCountry = useData((state) => state.byCountry);
  const byRegion = useData((state) => state.byRegion);

  return (
    <>
      <Header />
      <main>
        <section>
          <h2>Overview</h2>
          <Overview />
        </section>

        <section>
          <h2>Search</h2>
          <Search />
        </section>

        <section>
          <h2>By Taxonomic Level</h2>
          <Cols>
            <TaxonomicPrevalence
              id="by-phylum"
              title="By Phylum"
              data={byPhylum?.slice(0, 20)}
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

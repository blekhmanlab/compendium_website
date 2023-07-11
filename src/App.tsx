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
  const classes = useData((state) => state.classes);
  const phyla = useData((state) => state.phyla);
  const world = useData((state) => state.world);
  const countries = useData((state) => state.countries);

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
              data={phyla}
            />
            <TaxonomicPrevalence
              id="by-class"
              title="By Class"
              data={classes}
            />
          </Cols>
        </section>
        <section>
          <h2>By Geography</h2>
          <GeographicPrevalence
            id="map"
            title="By Geography"
            world={world}
            data={countries}
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

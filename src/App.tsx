import Cols from "@/components/Cols";
import { loadData, useData } from "@/data";
import ByGraph from "@/sections/ByGraph";
import Header from "@/sections/Header";
import Hero from "@/sections/Hero";
import Map from "@/sections/Map";
import "@/components/tooltip";
import "./App.css";

loadData();

const App = () => {
  const classes = useData((state) => state.classes);
  const phyla = useData((state) => state.phyla);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <section>
          <Cols>
            <ByGraph id="by-phylum" title="By Phylum" table={phyla} />
            <ByGraph id="by-class" title="By Class" table={classes} />
          </Cols>
        </section>
        <section>
          <Map id="map" title="By Region" />
        </section>
      </main>
    </>
  );
};

export default App;

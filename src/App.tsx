import Header from "@/sections/Header";
import Hero from "@/sections/Hero";
import ByGraph from "@/sections/ByGraph";
import { loadData, useData } from "@/data";
import "@/components/tooltip";
import "./App.css";
import Cols from "@/components/Cols";

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
      </main>
    </>
  );
};

export default App;

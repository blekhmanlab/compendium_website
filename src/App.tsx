import Snackbar from "@/components/Snackbar";
import Header from "@/sections/Header";
import Hero from "@/sections/Hero";
import ByGraph from "@/sections/ByGraph";
import { loadData, useData } from "@/data";
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
          <ByGraph id="by-class" title="By Class" table={classes} />
          <ByGraph id="by-phylum" title="By Phylum" table={phyla} />
        </section>
        <Snackbar />
      </main>
    </>
  );
};

export default App;

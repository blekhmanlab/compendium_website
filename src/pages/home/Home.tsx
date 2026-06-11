import { useEffect } from "react";
import Footer from "@/components/Footer";
import Compare from "./sections/Compare";
import Overview from "./sections/Overview";
import Prevalence from "./sections/Prevalence";
import Recipes from "./sections/Recipes";
import Search from "./sections/Search";
import Title from "./sections/Title";
import { loadGeo, loadMeta, loadProjects, loadTaxa } from "./state";

/** ensure only one load */
let loaded = false;

const Home = () => {
  /** load (small-enough) data on page load */
  useEffect(() => {
    if (!loaded) {
      loadMeta();
      loadProjects();
      loadGeo();
      loadTaxa();
      loaded = true;
    }
  }, []);

  return (
    <>
      <Title />
      <main>
        <Overview />
        <Search />
        <Prevalence />
        <Compare />
        <Recipes />
      </main>
      <Footer />
    </>
  );
};

export default Home;

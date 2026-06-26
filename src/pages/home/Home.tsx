import { useEffect } from "react";
import Footer from "@/components/Footer";
import Compare from "@/pages/home/sections/Compare";
import Overview from "@/pages/home/sections/Overview";
import Prevalence from "@/pages/home/sections/Prevalence";
import Recipes from "@/pages/home/sections/Recipes";
import Search from "@/pages/home/sections/Search";
import Title from "@/pages/home/sections/Title";
import { loadGeo, loadMeta, loadProjects, loadTaxa } from "@/pages/home/state";

/** ensure only one load */
let loaded = false;

export default function Home() {
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
}

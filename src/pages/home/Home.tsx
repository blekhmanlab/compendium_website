import { useEffect } from "react";
import Footer from "@/components/Footer";
import Meta from "@/components/Meta";
import { site } from "@/site";
import Compare from "./sections/Compare";
import Header from "./sections/Header";
import Overview from "./sections/Overview";
import Prevalence from "./sections/Prevalence";
import Recipes from "./sections/Recipes";
import Search from "./sections/Search";
import { loadGeo, loadMeta, loadProjects, loadTaxa, useData } from "./state";

export default function Home() {
  /** which compendium is selected */
  const compendium = useData((state) => state.compendium);

  /** load (small-enough) data on page load */
  useEffect(() => {
    const abort = new AbortController();
    loadMeta(compendium, abort);
    loadProjects(compendium, abort);
    loadGeo(compendium, abort);
    loadTaxa(compendium, abort);
    return () => abort.abort();
  }, [compendium]);

  return (
    <>
      <Meta
        title={site[compendium].title}
        description={site[compendium].description}
      />

      <Header />
      <main>
        <Overview />
        <Search />
        <Prevalence />
        {compendium === "human-microbiome-compendium" && (
          <>
            <Compare />
            <Recipes />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

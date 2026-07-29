import { useEffect } from "react";
import Footer from "@/components/Footer";
import Meta from "@/components/Meta";
import Extremes from "./sections/Extremes";
import Header from "./sections/Header";
import PCs from "./sections/PCs";
import Scree from "./sections/Scree";
import Upload from "./sections/Upload";
import { loadSamples, loadScree } from "./state";
import { useData } from "../home/state";

export default function Projectionist() {
  /** which compendium is selected */
  const compendium = useData((state) => state.compendium);

  /** load data on page load */
  useEffect(() => {
    const abort = new AbortController();
    loadSamples(compendium, abort);
    loadScree(compendium, abort);
    return () => abort.abort();
  }, [compendium]);

  return (
    <>
      <Meta
        title="Projectionist"
        description="Compare your data with data from the compendium"
      />

      <Header />
      <main>
        <Upload />
        <PCs />
        <Scree />
        <Extremes />
      </main>
      <Footer />
    </>
  );
}

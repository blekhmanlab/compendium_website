import { useEffect } from "react";
import Footer from "@/components/Footer";
import Meta from "@/components/Meta";
import Extremes from "./sections/Extremes";
import Header from "./sections/Header";
import PCs from "./sections/PCs";
import Scree from "./sections/Scree";
import Upload from "./sections/Upload";
import { loadSamples, loadScree } from "./state";

/** ensure only one load */
let loaded = false;

export default function Projectionist() {
  /** load data on page load */
  useEffect(() => {
    if (!loaded) {
      loadSamples();
      loadScree();
      loaded = true;
    }
  }, []);

  return (
    <>
      <Meta
        title="Projectionist"
        description="Compare your data with data from the Human Microbiome Compendium"
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

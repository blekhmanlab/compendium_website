import { useEffect } from "react";
import { ConeIcon } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Meta from "@/components/Meta";
import Extremes from "./sections/Extremes";
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

      <Header>
        <h2 className="justify-center font-light">
          <ConeIcon />
          Projectionist
        </h2>

        <div className="text-right">Compare your data</div>
      </Header>

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

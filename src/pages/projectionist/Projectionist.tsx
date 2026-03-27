import { useEffect } from "react";
import { ConeIcon } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Meta from "@/components/Meta";
import PCs from "@/pages/projectionist/sections/PCs";
import Scree from "@/pages/projectionist/sections/Scree";
import Upload from "@/pages/projectionist/sections/Upload";
import {
  loadSamplePCs,
  loadSamples,
  loadScree,
  loadTaxaMap,
  loadTaxonPCs,
} from "@/pages/projectionist/state";

/** ensure only one load */
let loaded = false;

const Projectionist = () => {
  /** load data on page load */
  useEffect(() => {
    if (!loaded) {
      loadTaxonPCs();
      loadSamplePCs();
      loadTaxaMap();
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
      </main>
      <Footer />
    </>
  );
};

export default Projectionist;

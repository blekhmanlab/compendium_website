import { useEffect } from "react";
import { ConeIcon } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Meta from "@/components/Meta";
import Upload from "@/pages/projectionist/sections/Upload";
import {
  loadSampleWeights,
  loadTaxaMap,
  loadTaxonWeights,
} from "@/pages/projectionist/state";

/** ensure only one load */
let loaded = false;

const Projectionist = () => {
  /** load data on page load */
  useEffect(() => {
    if (!loaded) {
      loadTaxonWeights();
      loadSampleWeights();
      loadTaxaMap();
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
        <h2>
          <ConeIcon />
          Projectionist
        </h2>
      </Header>

      <main>
        <Upload />
      </main>
      <Footer />
    </>
  );
};

export default Projectionist;

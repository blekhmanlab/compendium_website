import {
  loadGeoData,
  loadMetaData,
  loadProjectData,
  loadTaxaData,
} from "@/data";
import Footer from "@/sections/Footer";
import Header from "@/sections/Header";
import Overview from "@/sections/Overview";
import Prevalence from "@/sections/Prevalence";
import Recipes from "@/sections/Recipes";
import Search from "@/sections/Search";
import "@/components/tooltip";
import "./App.css";

loadMetaData();
loadProjectData();
loadGeoData();
loadTaxaData();
/** don't load tags data because large. load on demand. */

const App = () => (
  <>
    <Header />
    <main>
      <Overview />
      <Search />
      <Prevalence />
      <Recipes />
      <Footer />
    </main>
  </>
);

export default App;

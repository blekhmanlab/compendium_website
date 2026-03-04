import Footer from "@/components/Footer";
import {
  loadGeoData,
  loadMetaData,
  loadProjectData,
  loadTaxaData,
} from "@/pages/home/data";
import Compare from "./sections/Compare";
import Overview from "./sections/Overview";
import Prevalence from "./sections/Prevalence";
import Recipes from "./sections/Recipes";
import Search from "./sections/Search";
import Title from "./sections/Title";

loadMetaData();
loadProjectData();
loadGeoData();
loadTaxaData();
/** only load tags data on demand because large */

const Home = () => (
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

export default Home;

import Footer from "@/components/Footer";
import Compare from "@/pages/home/sections/Compare";
import Overview from "@/pages/home/sections/Overview";
import Prevalence from "@/pages/home/sections/Prevalence";
import Recipes from "@/pages/home/sections/Recipes";
import Search from "@/pages/home/sections/Search";
import Title from "@/pages/home/sections/Title";
import { loadGeo, loadMeta, loadProject, loadTaxa } from "@/pages/home/state";

loadMeta();
loadProject();
loadGeo();
loadTaxa();
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

import { loadData } from "@/data";
import Footer from "@/sections/Footer";
import GeographicPrevalence from "@/sections/GeographicPrevalence";
import Header from "@/sections/Header";
import Overview from "@/sections/Overview";
import Recipes from "@/sections/Recipes";
import Search from "@/sections/Search";
import TaxonomicPrevalence from "@/sections/TaxonomicPrevalence";
import "@/components/tooltip";
import "./App.css";

loadData();

const App = () => (
  <>
    <Header />
    <main>
      <Overview />
      <Search />
      <TaxonomicPrevalence />
      <GeographicPrevalence />
      <Recipes />
      <Footer />
    </main>
  </>
);

export default App;

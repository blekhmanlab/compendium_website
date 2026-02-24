import Footer from "@/components/Footer";
import Compare from "./sections/Compare";
import Overview from "./sections/Overview";
import Prevalence from "./sections/Prevalence";
import Recipes from "./sections/Recipes";
import Search from "./sections/Search";
import Title from "./sections/Title";

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

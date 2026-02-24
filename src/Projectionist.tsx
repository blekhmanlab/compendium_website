import ConeIcon from "@/assets/cone.svg?react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Meta from "@/components/Meta";

const Projectionist = () => (
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
      <section>hello world</section>
    </main>
    <Footer />
  </>
);

export default Projectionist;

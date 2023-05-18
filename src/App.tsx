import Cols from "@/components/Cols";
import { loadData, useData } from "@/data";
import GeographicPrevalence from "@/sections/GeographicPrevalence";
import Header from "@/sections/Header";
import Hero from "@/sections/Hero";
import TaxonomicPrevalence from "@/sections/TaxonomicPrevalence";
import "@/components/tooltip";
import "./App.css";

loadData();

const App = () => {
  const classes = useData((state) => state.classes);
  const phyla = useData((state) => state.phyla);
  const world = useData((state) => state.world);
  const countries = useData((state) => state.countries);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <section>
          <Cols>
            <TaxonomicPrevalence
              id="by-phylum"
              title="By Phylum"
              data={phyla}
            />
            <TaxonomicPrevalence
              id="by-class"
              title="By Class"
              data={classes}
            />
          </Cols>
        </section>
        <section>
          <GeographicPrevalence
            id="map"
            title="By Country"
            world={world}
            data={countries}
          />
        </section>
        <section>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Sed
            elementum tempus egestas sed sed risus pretium quam. Viverra nibh
            cras pulvinar mattis nunc sed. Ultrices in iaculis nunc sed augue
            lacus viverra vitae congue. Id diam vel quam elementum pulvinar
            etiam non quam. Diam maecenas ultricies mi eget mauris. Sed risus
            ultricies tristique nulla. Tortor condimentum lacinia quis vel eros
            donec. Ullamcorper malesuada proin libero nunc consequat interdum
            varius sit. Adipiscing elit ut aliquam purus sit amet luctus
            venenatis. Pulvinar pellentesque habitant morbi tristique senectus
            et.
          </p>
          <p>
            Faucibus ornare suspendisse sed nisi lacus. Ultricies lacus sed
            turpis tincidunt. Habitant morbi tristique senectus et netus. Cursus
            mattis molestie a iaculis at erat pellentesque adipiscing. Massa
            sapien faucibus et molestie ac feugiat sed. Aenean sed adipiscing
            diam donec adipiscing tristique risus nec feugiat. Enim blandit
            volutpat maecenas volutpat blandit. Blandit massa enim nec dui nunc
            mattis enim ut. Quam quisque id diam vel quam elementum pulvinar.
            Nisl pretium fusce id velit ut tortor. Elementum tempus egestas sed
            sed risus pretium quam vulputate. Parturient montes nascetur
            ridiculus mus mauris. Sed viverra ipsum nunc aliquet bibendum enim.
            Eget egestas purus viverra accumsan in nisl. Varius vel pharetra vel
            turpis nunc eget. Gravida in fermentum et sollicitudin ac orci.
            Tristique nulla aliquet enim tortor at auctor urna.
          </p>
          <p>
            Et ultrices neque ornare aenean. A diam sollicitudin tempor id. Sit
            amet mauris commodo quis imperdiet massa tincidunt. Pharetra et
            ultrices neque ornare aenean. Ut sem viverra aliquet eget sit.
            Mauris augue neque gravida in fermentum et sollicitudin ac. Non enim
            praesent elementum facilisis leo vel fringilla est ullamcorper. Id
            aliquet lectus proin nibh nisl condimentum id venenatis. Lacus
            suspendisse faucibus interdum posuere lorem. Quis imperdiet massa
            tincidunt nunc pulvinar sapien et ligula ullamcorper. Amet justo
            donec enim diam vulputate ut. Hendrerit dolor magna eget est. Ornare
            quam viverra orci sagittis eu. In arcu cursus euismod quis viverra.
            Turpis nunc eget lorem dolor sed viverra ipsum nunc aliquet. Diam
            quam nulla porttitor massa id neque aliquam vestibulum.
          </p>
        </section>
      </main>
    </>
  );
};

export default App;

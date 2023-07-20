import Accordion from "@/components/Accordion";
import classes from "./Recipes.module.css";

const Recipes = () => (
  <div className={classes.recipes}>
    <Accordion title="All samples from a single world region">
      <p>
        Lorem ipsum <code>dolor sit amet</code>, consectetur{" "}
        <a href="link">adipiscing</a> elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </p>
      <ol>
        <li>Sed elementum tempus egestas sed sed risus pretium quam.</li>
        <li>Viverra nibh cras pulvinar mattis nunc sed.</li>
        <li>Ultrices in iaculis nunc sed augue lacus viverra vitae congue.</li>
      </ol>
      <p>
        Tortor condimentum lacinia quis vel eros donec. Ullamcorper malesuada
        proin libero nunc consequat interdum varius sit. Adipiscing elit ut
        aliquam purus sit amet luctus venenatis. Pulvinar pellentesque habitant
        morbi tristique senectus et.
      </p>
    </Accordion>

    <Accordion title="All samples from a set of 4 BioProjects">
      <p>
        Lorem ipsum <code>dolor sit amet</code>, consectetur{" "}
        <a href="link">adipiscing</a> elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </p>
      <ol>
        <li>Sed elementum tempus egestas sed sed risus pretium quam.</li>
        <li>Viverra nibh cras pulvinar mattis nunc sed.</li>
        <li>Ultrices in iaculis nunc sed augue lacus viverra vitae congue.</li>
      </ol>
      <p>
        Tortor condimentum lacinia quis vel eros donec. Ullamcorper malesuada
        proin libero nunc consequat interdum varius sit. Adipiscing elit ut
        aliquam purus sit amet luctus venenatis. Pulvinar pellentesque habitant
        morbi tristique senectus et.
      </p>
    </Accordion>

    <Accordion title="All samples with read counts consolidated at the order level">
      <p>
        Lorem ipsum <code>dolor sit amet</code>, consectetur{" "}
        <a href="link">adipiscing</a> elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </p>
      <ol>
        <li>Sed elementum tempus egestas sed sed risus pretium quam.</li>
        <li>Viverra nibh cras pulvinar mattis nunc sed.</li>
        <li>Ultrices in iaculis nunc sed augue lacus viverra vitae congue.</li>
      </ol>
      <p>
        Tortor condimentum lacinia quis vel eros donec. Ullamcorper malesuada
        proin libero nunc consequat interdum varius sit. Adipiscing elit ut
        aliquam purus sit amet luctus venenatis. Pulvinar pellentesque habitant
        morbi tristique senectus et.
      </p>
    </Accordion>

    <Accordion title="All samples with less than 10 percent Firmicutes">
      <p>
        Lorem ipsum <code>dolor sit amet</code>, consectetur{" "}
        <a href="link">adipiscing</a> elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </p>
      <ol>
        <li>Sed elementum tempus egestas sed sed risus pretium quam.</li>
        <li>Viverra nibh cras pulvinar mattis nunc sed.</li>
        <li>Ultrices in iaculis nunc sed augue lacus viverra vitae congue.</li>
      </ol>
      <p>
        Tortor condimentum lacinia quis vel eros donec. Ullamcorper malesuada
        proin libero nunc consequat interdum varius sit. Adipiscing elit ut
        aliquam purus sit amet luctus venenatis. Pulvinar pellentesque habitant
        morbi tristique senectus et.
      </p>
    </Accordion>
  </div>
);

export default Recipes;

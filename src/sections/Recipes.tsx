import { ReactComponent as DownloadIcon } from "@/assets/download.svg";
import { ReactComponent as RecipeIcon } from "@/assets/recipe.svg";
import Button from "@/components/Button";
import classes from "./Recipes.module.css";

const Recipes = () => (
  <section>
    <h2>Recipes</h2>

    <p>
      <a href={import.meta.env.VITE_R_PACKAGE} target="_blank">
        <DownloadIcon className="inline-svg" />
        Download the R package
      </a>{" "}
      to do more advanced filtering and analyses with the data, such as...
    </p>

    <div className={classes.buttons}>
      <Button
        icon={RecipeIcon}
        href={import.meta.env.VITE_R_PACKAGE + "#recipe-1"}
      >
        Get samples from a single world region
      </Button>
      <Button
        icon={RecipeIcon}
        href={import.meta.env.VITE_R_PACKAGE + "#recipe-2"}
      >
        Get samples from a set of 4 BioProjects
      </Button>
      <Button
        icon={RecipeIcon}
        href={import.meta.env.VITE_R_PACKAGE + "#recipe-3"}
      >
        Get samples with read counts consolidated at the order level
      </Button>
      <Button
        icon={RecipeIcon}
        href={import.meta.env.VITE_R_PACKAGE + "#recipe-4"}
      >
        Get samples with less than 10% Firmicutes
      </Button>
    </div>
  </section>
);

export default Recipes;

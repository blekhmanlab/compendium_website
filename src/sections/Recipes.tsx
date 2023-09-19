import { ReactComponent as PackageIcon } from "@/assets/package.svg";
import { ReactComponent as RecipeIcon } from "@/assets/recipe.svg";
import Button from "@/components/Button";
import classes from "./Recipes.module.css";

const recipes = [
  {
    link: "samples-in-specific-bioprojects",
    name: "Get samples in specific BioProjects",
  },
  {
    link: "samples-from-a-specific-world-region",
    name: "Get samples from a specific world region",
  },
  {
    link: "histogram-of-total-bases-per-sample",
    name: "See a histogram of total bases per sample",
  },
  {
    link: "read-counts-aggregated-to-order",
    name: "See read counts aggregated to order",
  },
  {
    link: "samples-filtered-by-presence-of-microbe",
    name: "Get samples filtered by presence of microbe",
  },
];

const Recipes = () => (
  <section>
    <h2>Recipes</h2>

    <p>
      Some of the things you can do with{" "}
      <a href={import.meta.env.VITE_R_PACKAGE} target="_blank">
        <PackageIcon className="inline-svg" />
        the R package
      </a>
      :
    </p>

    <div className={classes.buttons}>
      {recipes.map(({ link, name }, index) => (
        <Button
          key={index}
          icon={RecipeIcon}
          href={
            import.meta.env.VITE_R_PACKAGE + "articles/overview.html#" + link
          }
        >
          {name}
        </Button>
      ))}
    </div>
  </section>
);

export default Recipes;

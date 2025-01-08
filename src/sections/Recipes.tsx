import PackageIcon from "@/assets/package.svg?react";
import RecipeIcon from "@/assets/recipe.svg?react";
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
    link: "samples-from-a-specific-country",
    name: "Get samples from a specific country",
  },
  {
    link: "enrich-data-with-country-names",
    name: "Enrich data with country names",
  },
  {
    link: "histogram-of-total-bases-per-sample",
    name: "Generate histogram of total bases per sample",
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

import { LightbulbIcon, PackageIcon } from "lucide-react";
import Button from "@/components/Button";

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

export default function Recipes() {
  return (
    <section>
      <h2>Recipes</h2>

      <p>
        Some of the things you can do with{" "}
        <a href={import.meta.env.VITE_R_PACKAGE} target="_blank">
          <PackageIcon />
          the R package
        </a>
        :
      </p>

      <div className="flex flex-col flex-wrap gap-4">
        {recipes.map(({ link, name }, index) => (
          <Button
            key={index}
            to={
              import.meta.env.VITE_R_PACKAGE + "articles/overview.html#" + link
            }
            className="justify-start"
          >
            <LightbulbIcon />
            {name}
          </Button>
        ))}
      </div>
    </section>
  );
}

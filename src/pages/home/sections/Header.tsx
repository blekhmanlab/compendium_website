import { CheckIcon, DownloadIcon, PackageIcon, ScrollIcon } from "lucide-react";
import Button from "@/components/Button.tsx";
import HeaderWrapper from "@/components/Header";
import Title from "@/components/Title";
import Tooltip from "@/components/Tooltip";
import Viz from "@/pages/home/sections/Viz";
import { useData } from "@/pages/home/state";
import { site } from "@/site";

export default function Header() {
  /** which compendium is selected */
  const compendium = useData((state) => state.compendium);

  return (
    <HeaderWrapper>
      <Viz />

      <div className="-mt-10 flex flex-wrap items-center justify-center gap-4">
        {Object.entries(site).map(([id, { title, description }]) => (
          <Tooltip
            key={id}
            content={
              id === compendium ? "" : `Switch to the ${title}: ${description}`
            }
          >
            <Button design="accent" to={{ search: `?compendium=${id}` }}>
              {id === compendium ? <CheckIcon /> : null}
              {title}
            </Button>
          </Tooltip>
        ))}
      </div>

      <Title className="text-3xl max-sm:text-xl" />

      <p className="text-lg">{site[compendium].description}</p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Tooltip content="Learn more about the methods and significance behind this project.">
          <Button design="accent" to={site[compendium].paper}>
            <ScrollIcon />
            Paper
          </Button>
        </Tooltip>
        <Tooltip content="Do advanced filtering and analyses with the data.">
          <Button design="accent" to={site[compendium].rPackage}>
            <PackageIcon />R Package
          </Button>
        </Tooltip>
        <Tooltip content="Download the dataset directly as CSV/TSV files.">
          <Button design="accent" to={site[compendium].data}>
            <DownloadIcon />
            CSV data
          </Button>
        </Tooltip>
      </div>
    </HeaderWrapper>
  );
}

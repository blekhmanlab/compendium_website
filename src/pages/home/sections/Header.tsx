import { DownloadIcon, PackageIcon, ScrollIcon } from "lucide-react";
import Button from "@/components/Button.tsx";
import HeaderWrapper from "@/components/Header";
import Title from "@/components/Title";
import Tooltip from "@/components/Tooltip";
import Viz from "@/pages/home/sections/Viz";
import { site } from "@/site";

export default function Header() {
  return (
    <HeaderWrapper>
      <Viz />

      <Title className="text-3xl max-sm:text-xl" />

      <p className="max-w-140 text-lg/relaxed font-light max-md:text-base">
        {site.humanMicrobiomeCompendium.description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Tooltip content="Learn more about the methods and significance behind this project.">
          <Button design="accent" to={site.humanMicrobiomeCompendium.paper}>
            <ScrollIcon />
            Paper
          </Button>
        </Tooltip>
        <Tooltip content="Do advanced filtering and analyses with the data.">
          <Button design="accent" to={site.humanMicrobiomeCompendium.rPackage}>
            <PackageIcon />R Package
          </Button>
        </Tooltip>
        <Tooltip content="Download the dataset directly as CSV/TSV files.">
          <Button design="accent" to={site.humanMicrobiomeCompendium.data}>
            <DownloadIcon />
            CSV data
          </Button>
        </Tooltip>
      </div>
    </HeaderWrapper>
  );
}

import { DownloadIcon, PackageIcon, ScrollIcon } from "lucide-react";
import Button from "@/components/Button.tsx";
import Header from "@/components/Header";
import Viz from "@/pages/home/sections/Viz";

export default function Title() {
  return (
    <Header big>
      <Viz />
      <p
        className="
        max-w-140 text-lg/relaxed font-light
        max-md:text-base
      "
      >
        {import.meta.env.VITE_DESCRIPTION}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button
          design="accent"
          to={import.meta.env.VITE_PAPER}
          data-tooltip="Learn more about the methods and significance behind this project."
        >
          <ScrollIcon />
          Paper
        </Button>
        <Button
          design="accent"
          to={import.meta.env.VITE_R_PACKAGE}
          data-tooltip="Do advanced filtering and analyses with the data."
        >
          <PackageIcon />R Package
        </Button>
        <Button
          design="accent"
          to={import.meta.env.VITE_DATA}
          data-tooltip="Download the dataset directly as CSV/TSV files."
        >
          <DownloadIcon />
          CSV data
        </Button>
      </div>
    </Header>
  );
}

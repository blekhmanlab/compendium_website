import DownloadIcon from "@/assets/download.svg?react";
import PackageIcon from "@/assets/package.svg?react";
import PaperIcon from "@/assets/paper.svg?react";
import Button from "@/components/Button.tsx";
import Header from "@/components/Header";
import Viz from "@/pages/home/sections/Viz";
import classes from "./Title.module.css";

const Title = () => (
  <Header big>
    <Viz />
    <p className={classes.subtitle}>{import.meta.env.VITE_DESCRIPTION}</p>

    <div className={classes.buttons}>
      <Button
        icon={PaperIcon}
        design="big"
        to={import.meta.env.VITE_PAPER}
        data-tooltip="Learn more about the methods and significance behind this project."
      >
        Paper
      </Button>
      <Button
        icon={PackageIcon}
        design="big"
        to={import.meta.env.VITE_R_PACKAGE}
        data-tooltip="Do advanced filtering and analyses with the data."
      >
        R Package
      </Button>
      <Button
        icon={DownloadIcon}
        design="big"
        to={import.meta.env.VITE_DATA}
        data-tooltip="Download the dataset directly as CSV/TSV files."
      >
        CSV data
      </Button>
    </div>
  </Header>
);

export default Title;

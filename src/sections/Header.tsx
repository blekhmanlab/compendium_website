import { ReactComponent as PaperIcon } from "@/assets/book.svg";
import { ReactComponent as DownloadIcon } from "@/assets/download.svg";
import { ReactComponent as Logo } from "@/assets/logo.svg";
import { ReactComponent as PackageIcon } from "@/assets/package.svg";
import Button from "@/components/Button.tsx";
import HeaderBg from "@/sections/HeaderBg.tsx";
import classes from "./Header.module.css";

const Header = () => (
  <header className={classes.header}>
    <HeaderBg />

    <div className={classes.title}>
      <Logo className={classes.logo}></Logo>
      <div className={classes.divider}></div>
      <h1 className={classes.h1}>{import.meta.env.VITE_TITLE}</h1>
    </div>

    <p className={classes.subtitle}>{import.meta.env.VITE_DESCRIPTION}</p>

    <div className={classes.buttons}>
      <Button
        icon={PaperIcon}
        design="big"
        href={import.meta.env.VITE_PAPER}
        data-tooltip="Learn about the methods behind and significance of this dataset."
      >
        Paper
      </Button>
      <Button
        icon={PackageIcon}
        design="big"
        href={import.meta.env.VITE_R_PACKAGE}
        data-tooltip="Use our R package to do more advanced filtering and analyses with the dataset."
      >
        R Package
      </Button>
      <Button
        icon={DownloadIcon}
        design="big"
        href={import.meta.env.VITE_DATA}
        data-tooltip="Download the data directly as CSV/TSV files."
      >
        CSV data
      </Button>
    </div>
  </header>
);

export default Header;

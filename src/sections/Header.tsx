import Button from "../components/Button.tsx";
import { ReactComponent as HumanIcon } from "@/assets/logo.svg";
import { ReactComponent as BookIcon } from "@/assets/book.svg";
import { ReactComponent as DataIcon } from "@/assets/data.svg";
import classes from "./Header.module.css";

const Header = () => (
  <header className={classes.header}>
    <div className={classes.title}>
      <HumanIcon className={classes.logo}></HumanIcon>
      <div className={classes.divider}></div>
      <h1>
        Human
        <br />
        Microbiome
        <br />
        Compendium
      </h1>
    </div>

    <p className={classes.subtitle}>
      An ongoing project to build a dataset of the human microbiome at an
      unprecedented scale.
    </p>

    <div>
      <Button icon={BookIcon} href="some-link">
        Read the paper
      </Button>
      <Button icon={DataIcon} href="some-link">
        Download full data
      </Button>
    </div>
  </header>
);

export default Header;

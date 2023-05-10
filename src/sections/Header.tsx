import Button from "@/components/Button.tsx";
import Viz from "@/sections/Viz.tsx";
import { ReactComponent as Logo } from "@/assets/logo.svg";
import { ReactComponent as BookIcon } from "@/assets/book.svg";
import { ReactComponent as DataIcon } from "@/assets/data.svg";
import classes from "./Header.module.css";

const Header = () => (
  <header className={classes.header}>
    <Viz />
    <div className={classes.title}>
      <Logo className={classes.logo}></Logo>
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

    <div className={classes.buttons}>
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

import { ReactComponent as BookIcon } from "@/assets/book.svg";
import { ReactComponent as DataIcon } from "@/assets/data.svg";
import { ReactComponent as Logo } from "@/assets/logo.svg";
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

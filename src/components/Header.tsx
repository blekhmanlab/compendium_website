import type { ReactNode } from "react";
import { Link } from "react-router";
import Logo from "@/assets/logo.svg?react";
import classes from "./Header.module.css";

type Props = {
  children: ReactNode;
  big?: boolean;
};

const Header = ({ children, big = false }: Props) => {
  return (
    <header className={classes.header} data-big={big}>
      <Link className={classes.title} to={!big ? "/" : ""}>
        <Logo className={classes.logo}></Logo>
        <div className={classes.divider}></div>
        <h1 className={classes.h1}>{import.meta.env.VITE_TITLE}</h1>
      </Link>

      {children}
    </header>
  );
};

export default Header;

import type { ReactNode } from "react";
import { Link } from "react-router";
import Logo from "@/assets/logo.svg?react";

type Props = {
  children: ReactNode;
  big?: boolean;
};

const Header = ({ children, big = false }: Props) => {
  return (
    <header className="relative isolate items-center py-24">
      <Link
        className="
          grid max-w-full grid-cols-[auto_auto_min-content] place-items-center
          gap-6
        "
        to={!big ? "/" : ""}
      >
        <Logo className="min-h-full"></Logo>
        <div className="h-full w-0.5 bg-white"></div>
        <h1 className="-my-2 text-left">{import.meta.env.VITE_TITLE}</h1>
      </Link>

      {children}
    </header>
  );
};

export default Header;

import type { ReactNode } from "react";
import clsx from "clsx";
import Logo from "@/assets/logo.svg?react";

type Props = {
  children: ReactNode;
  big?: boolean;
};

const Header = ({ children, big = false }: Props) => {
  return (
    <header
      className={clsx(
        `relative isolate flex items-center bg-linear-to-r from-fuchsia-950 to-indigo-950`,
        big
          ? "flex-col gap-12 px-12 py-24"
          : `flex-wrap gap-8 p-8 *:flex-1 max-md:flex-col`,
      )}
    >
      <a
        className="grid max-w-full flex-1 grid-cols-[min-content_auto_min-content] place-items-center justify-start gap-6 text-inherit no-underline max-md:gap-4"
        href={!big ? "/" : ""}
      >
        <Logo className="min-h-full" />
        <div className="h-full w-0.5 bg-white" />
        <h1
          className={clsx(
            "-my-2",
            big
              ? `text-3xl font-semibold max-md:text-2xl max-sm:text-xl`
              : "text-xl",
          )}
        >
          {import.meta.env.VITE_TITLE}
        </h1>
      </a>

      {children}
    </header>
  );
};

export default Header;

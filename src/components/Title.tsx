import { useLocation } from "react-router";
import clsx from "clsx";
import Logo from "@/assets/logo.svg?react";
import { useSite } from "@/pages/home/state";

export default function Title({ className = "" }) {
  const site = useSite();
  const { pathname } = useLocation();

  const isHome = pathname === "/";
  const Component = isHome ? "div" : "a";
  const props = isHome ? {} : { href: "/" };

  return (
    <Component
      className={clsx(
        "flex flex-1 items-center justify-center gap-[0.75em] text-inherit no-underline",
        className,
      )}
      {...props}
    >
      <Logo className="h-[3em]" />
      <div className="w-0.5 self-stretch bg-white" />
      <h1 className="-my-2 max-w-min">{site.title}</h1>
    </Component>
  );
}

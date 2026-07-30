import clsx from "clsx";
import Logo from "@/assets/logo.svg?react";
import { useData } from "@/pages/home/state";
import { site } from "@/site";

export default function Title({ className = "" }) {
  /** which compendium is selected */
  const compendium = useData((state) => state.compendium);

  return (
    <a
      className={clsx(
        "flex flex-1 items-center justify-center gap-[1em] text-inherit no-underline",
        className,
      )}
      href="/"
    >
      <Logo className="h-[3em]" />
      <div className="w-0.5 self-stretch bg-white" />
      <h1 className="max-w-min leading-tight">{site[compendium].title}</h1>
    </a>
  );
}

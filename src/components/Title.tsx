import clsx from "clsx";
import Logo from "@/assets/logo.svg?react";
import { site } from "@/site";

export default function Title({ className = "" }) {
  return (
    <a
      className={clsx(
        "grid max-w-full flex-1 grid-cols-[min-content_auto_min-content] place-items-center justify-start gap-[1em] text-inherit no-underline",
        className,
      )}
      href="/"
    >
      <Logo className="min-h-full" />
      <div className="h-full w-0.5 bg-white" />
      <h1 className="-my-2 leading-tight">
        {site.humanMicrobiomeCompendium.title}
      </h1>
    </a>
  );
}

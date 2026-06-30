import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  className?: string;
  children: ReactNode;
};

export default function Header({ className, children }: Props) {
  return (
    <header
      className={clsx(
        "relative isolate flex flex-col items-center gap-12 bg-linear-to-r from-fuchsia-950 to-indigo-950 px-12 py-24",
        className,
      )}
    >
      {children}
    </header>
  );
}

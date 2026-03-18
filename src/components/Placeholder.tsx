import type { ReactNode } from "react";
import clsx from "clsx";
import LoadingIcon from "@/assets/loading.svg?react";

type Props = {
  height?: number;
  className?: string;
  children: ReactNode;
};

const Placeholder = ({ className = "", children }: Props) => (
  <div
    className={clsx(
      `
        flex w-full items-center justify-center gap-4 rounded-md bg-slate-500/10
        p-2
      `,
      className,
    )}
  >
    <LoadingIcon />
    {children}
  </div>
);

export default Placeholder;

import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import clsx from "clsx";

type Anchor = ComponentProps<typeof Link>;
type Button = ComponentProps<"button">;

type Props = (Anchor | Button) & {
  design?: "regular" | "accent";
  children: ReactNode;
};

export default function Button({
  design = "regular",
  className,
  ...props
}: Props) {
  className = clsx(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-inherit no-underline transition",
    design === "regular" &&
      "border border-slate-500/50 px-4 py-2 hover:bg-slate-500/50 aria-selected:bg-slate-500/50",
    design === "accent" &&
      "bg-slate-500/25 bg-linear-to-r px-4 py-2 text-lg hover:scale-105 hover:from-fuchsia-600 hover:to-indigo-600",
    className,
  );

  if ("to" in props) {
    return (
      <Link
        className={className}
        target={String(props.to).startsWith("http") ? "_blank" : undefined}
        {...(props as Anchor)}
      />
    );
  }
  if ("onClick" in props)
    return <button className={className} {...(props as Button)} />;
  return <></>;
}

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
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full leading-none text-inherit no-underline transition",
    design === "regular" &&
      "border border-light-gray p-3 hover:bg-light-gray aria-selected:bg-light-gray",
    design === "accent" &&
      "bg-white/5 bg-linear-to-r p-3 text-lg hover:scale-105 hover:from-primary hover:to-secondary",
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

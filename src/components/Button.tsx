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
    "cursor-pointer items-center justify-center gap-2 rounded-full text-center text-inherit no-underline hover:opacity-100",
    design === "regular" &&
      "border border-light-gray px-4 py-2 hover:bg-light-gray aria-selected:bg-light-gray",
    design === "accent" &&
      "bg-white/10 bg-linear-to-r px-4 py-2 text-lg hover:scale-103 hover:from-primary hover:to-secondary",
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

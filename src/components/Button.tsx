import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import clsx from "clsx";
import type { SyncFunctionComponent } from "@/util/types";
import classes from "./Button.module.css";

type Anchor = ComponentProps<typeof Link>;
type Button = ComponentProps<"button">;

type Props = (Anchor | Button) & {
  icon?: SyncFunctionComponent;
  design?: string;
  children: ReactNode;
};

const Button = ({
  icon,
  design = "",
  className,
  children,
  ...props
}: Props) => {
  if ("to" in props) {
    return (
      <Link
        className={clsx(classes.button, className)}
        data-design={design}
        target={String(props.to).startsWith("http") ? "_blank" : undefined}
        {...(props as Anchor)}
      >
        {icon?.({ className: classes.icon })}
        {children}
      </Link>
    );
  }
  if ("onClick" in props)
    return (
      <button
        className={clsx(classes.button, className)}
        data-design={design}
        {...(props as Button)}
      >
        {icon?.({ className: classes.icon })}
        {children}
      </button>
    );
  return <></>;
};

export default Button;

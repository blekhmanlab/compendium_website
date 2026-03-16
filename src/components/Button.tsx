import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import clsx from "clsx";
import classes from "./Button.module.css";

type Anchor = ComponentProps<typeof Link>;
type Button = ComponentProps<"button">;

type Props = (Anchor | Button) & {
  icon?: ReactNode;
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
        {icon}
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
        {icon}
        {children}
      </button>
    );
  return <></>;
};

export default Button;

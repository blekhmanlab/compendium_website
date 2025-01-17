import type { ComponentProps, ReactNode } from "react";
import clsx from "clsx";
import type { SyncFunctionComponent } from "@/util/types";
import classes from "./Button.module.css";

type Anchor = ComponentProps<"a">;
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
  if ("href" in props)
    return (
      <a
        className={clsx(classes.button, className)}
        data-design={design}
        target="_blank"
        {...(props as Anchor)}
      >
        {icon?.({ className: classes.icon })}
        {children}
      </a>
    );
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

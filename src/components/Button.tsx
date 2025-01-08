import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
  Ref,
} from "react";
import type { SyncFunctionComponent } from "@/util/types";
import classes from "./Button.module.css";

type Anchor = {
  ref?: Ref<HTMLAnchorElement>;
} & AnchorHTMLAttributes<HTMLAnchorElement>;
type Button = {
  ref?: Ref<HTMLButtonElement>;
} & ButtonHTMLAttributes<HTMLButtonElement>;

type Props = {
  icon?: SyncFunctionComponent;
  design?: string;
  children: ReactNode;
} & (Anchor | Button);

const Button = ({ ref, icon, design = "", children, ...props }: Props) => {
  if ("href" in props)
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        className={classes.button}
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
        ref={ref as Ref<HTMLButtonElement>}
        className={classes.button}
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

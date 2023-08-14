import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  forwardRef,
  FunctionComponent,
  ReactNode,
  Ref,
} from "react";
import classes from "./Button.module.css";

type Anchor = AnchorHTMLAttributes<HTMLAnchorElement>;
type Button = ButtonHTMLAttributes<HTMLButtonElement>;
type AnchorOrButton = Anchor | Button;

type Props = {
  icon?: FunctionComponent;
  design?: string;
  children: ReactNode;
} & AnchorOrButton;

const Button = forwardRef(
  (
    { icon, design = "", children, ...props }: Props,
    ref: Ref<HTMLAnchorElement | HTMLButtonElement>,
  ) => {
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
  },
);

export default Button;

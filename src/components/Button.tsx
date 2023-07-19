import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  FunctionComponent,
  ReactNode,
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

const isAnchor = (props: AnchorOrButton): props is Anchor => "href" in props;
const isButton = (props: AnchorOrButton): props is Button => "onClick" in props;

const Button = ({ icon, design = "", children, ...props }: Props) => {
  if (isAnchor(props))
    return (
      <a className={classes.button} data-design={design} {...props}>
        {icon?.({ className: classes.icon })}
        {children}
      </a>
    );
  if (isButton(props))
    return (
      <button className={classes.button} data-design={design} {...props}>
        {icon?.({ className: classes.icon })}
        {children}
      </button>
    );
  return <></>;
};

export default Button;

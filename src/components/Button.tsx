import { AnchorHTMLAttributes, FunctionComponent, ReactNode } from "react";
import classes from "./Button.module.css";

type Props = {
  icon?: FunctionComponent;
  children: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

const Button = ({ icon, children, ...props }: Props) => (
  <a className={classes.button} {...props}>
    {icon?.({ className: classes.icon })}
    {children}
  </a>
);

export default Button;

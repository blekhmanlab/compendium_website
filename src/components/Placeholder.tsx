import { ReactNode } from "react";
import classes from "./Placeholder.module.css";

type Props = {
  className?: string;
  children: ReactNode;
};

const Placeholder = ({ className = "", children }: Props) => (
  <div className={[classes.placeholder, className].join(" ")}>
    <p>{children}</p>
  </div>
);

export default Placeholder;

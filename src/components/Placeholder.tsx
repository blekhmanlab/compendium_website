import { ReactNode } from "react";
import classes from "./Placeholder.module.css";

type Props = {
  height?: number;
  className?: string;
  children: ReactNode;
};

const Placeholder = ({ height = 300, className = "", children }: Props) => (
  <div
    className={[classes.placeholder, className].join(" ")}
    style={{ height: height + "px" }}
  >
    <p>{children}</p>
  </div>
);

export default Placeholder;

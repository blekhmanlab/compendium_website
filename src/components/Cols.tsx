import { ReactNode } from "react";
import classes from "./Cols.module.css";

type Props = {
  children: ReactNode;
};

const Cols = ({ children }: Props) => (
  <div className={classes.cols}>{children}</div>
);

export default Cols;

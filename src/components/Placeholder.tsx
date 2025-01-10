import type { ReactNode } from "react";
import LoadingIcon from "@/assets/loading.svg?react";
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
    <LoadingIcon />
    {children}
  </div>
);

export default Placeholder;

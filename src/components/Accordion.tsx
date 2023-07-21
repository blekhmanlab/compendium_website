import { ReactNode } from "react";
import classes from "./Accordion.module.css";

type Props = {
  title: ReactNode;
  children: ReactNode;
};

const Accordion = ({ title, children }: Props) => (
  <details className={classes.details}>
    <summary className={classes.summary}>{title}</summary>
    <div className={["content", classes.content].join(" ")}>{children}</div>
  </details>
);

export default Accordion;

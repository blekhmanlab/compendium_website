import { InputHTMLAttributes } from "react";
import classes from "./Textbox.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">;

const Textbox = ({ value, onChange, ...props }: Props) => (
  <input
    type="text"
    className={classes.input}
    {...props}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    autoComplete="off"
    autoCorrect="off"
    autoCapitalize="off"
    spellCheck="false"
  />
);

export default Textbox;

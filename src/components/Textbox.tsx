import { InputHTMLAttributes } from "react";
import { ReactComponent as XIcon } from "@/assets/x.svg";
import classes from "./Textbox.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">;

const Textbox = ({ value, onChange, ...props }: Props) => (
  <div className={classes.wrapper}>
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
    <button
      className={classes.button}
      data-tooltip="Clear"
      onClick={() => onChange("")}
    >
      <XIcon />
    </button>
  </div>
);

export default Textbox;

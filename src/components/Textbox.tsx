import type { ComponentProps } from "react";
import { XIcon } from "lucide-react";
import classes from "./Textbox.module.css";

type Single = { multi?: false } & Omit<ComponentProps<"input">, "onChange">;
type Multi = { multi: true } & Omit<ComponentProps<"textarea">, "onChange">;

type Base = {
  value: string;
  onChange: (value: string) => void;
};

type Props = Base & (Single | Multi);

const Textbox = ({ multi, value, onChange, ...props }: Props) => (
  <div className={classes.wrapper}>
    {multi ? (
      <textarea
        className={classes.input}
        {...(props as ComponentProps<"textarea">)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
    ) : (
      <input
        type="text"
        className={classes.input}
        {...(props as ComponentProps<"input">)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
    )}
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

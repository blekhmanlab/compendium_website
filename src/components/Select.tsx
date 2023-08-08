import { SelectHTMLAttributes } from "react";
import { startCase } from "lodash";
import classes from "./Select.module.css";

type Props<Options extends string[]> = {
  label: string;
  value: Options[number];
  onChange: (value: Options[number]) => void;
  options: Options;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange">;

const Select = <Options extends string[]>({
  label,
  value,
  onChange,
  options,
  ...props
}: Props<Options>) => (
  <label className={classes.label}>
    <span>{label}</span>
    <select
      className={classes.select}
      {...props}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option, index) => (
        <option key={index} value={option}>
          {startCase(option)}
        </option>
      ))}
    </select>
  </label>
);

export default Select;

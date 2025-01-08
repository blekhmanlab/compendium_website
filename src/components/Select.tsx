import type { SelectHTMLAttributes } from "react";
import { startCase } from "lodash";
import AngleIcon from "@/assets/angle.svg?react";
import classes from "./Select.module.css";

type Props<Option extends string> = {
  label: string;
  value: Option;
  onChange: (value: Option) => void;
  options: readonly Option[];
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange">;

const Select = <Option extends string>({
  label,
  value,
  onChange,
  options,
  ...props
}: Props<Option>) => (
  <label className={classes.label}>
    <span>{label}</span>
    <span className={classes.wrapper}>
      <select
        className={classes.select}
        {...props}
        value={value}
        onChange={(event) => onChange(event.target.value as Option)}
      >
        {options.map((option, index) => (
          <option key={index} value={option}>
            {startCase(option)}
          </option>
        ))}
      </select>
      <AngleIcon />
    </span>
  </label>
);

export default Select;

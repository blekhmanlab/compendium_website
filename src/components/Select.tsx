import type { ComponentProps } from "react";
import { startCase } from "lodash";
import { ChevronDownIcon } from "lucide-react";

type Props<Option extends string> = {
  label: string;
  value: Option;
  onChange: (value: Option) => void;
  options: readonly Option[];
} & Omit<ComponentProps<"select">, "onChange">;

const Select = <Option extends string>({
  label,
  value,
  onChange,
  options,
  ...props
}: Props<Option>) => (
  <label className="inline-flex items-center gap-2">
    <span className="text-right">{label}</span>
    <span className="relative">
      <select
        className="
          min-w-20 cursor-pointer appearance-none rounded-md bg-slate-500/25 p-2
          pr-8 transition
          hover:bg-slate-500/50
        "
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
      <ChevronDownIcon
        className="
          pointer-events-none absolute top-1/2 right-1 -translate-y-1/2
        "
      />
    </span>
  </label>
);

export default Select;

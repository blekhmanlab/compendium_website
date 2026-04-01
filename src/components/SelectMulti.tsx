import type { ComponentProps } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import clsx from "clsx";
import { startCase, truncate } from "lodash";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

type Props<Option extends string> = {
  label: string;
  value: Option[];
  onChange: (value: Option[]) => void;
  options: readonly Option[];
} & Omit<ComponentProps<"select">, "value" | "onChange">;

const SelectMulti = <Option extends string>({
  label,
  value,
  onChange,
  options,
  className = "",
}: Props<Option>) => {
  /** selected label */
  let selected = "";
  if (value.length === 0) selected = "None";
  else if (value.length === options.length) selected = "All";
  else if (value.length === 1) selected = truncate(value[0]!, { length: 15 });
  else selected = `${value.length} selected`;

  const allSelected = value.length === options.length;

  const toggleSelectAll = () => onChange(allSelected ? [] : [...options]);

  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-right">{label}</span>
      <Listbox multiple value={value} onChange={onChange}>
        <ListboxButton
          className={clsx(
            "flex min-w-20 cursor-pointer appearance-none items-center gap-2",
            "rounded-md bg-slate-500/25 p-2 transition",
            "hover:bg-slate-500/50",
            className,
          )}
        >
          <span className="grow truncate text-left">{selected}</span>
          <ChevronDownIcon />
        </ListboxButton>
        <ListboxOptions
          anchor={{ to: "bottom start", padding: 12, gap: 4 }}
          className="
            flex flex-col rounded-md border border-slate-500 bg-slate-800
          "
        >
          <button
            onClick={toggleSelectAll}
            className="
              flex cursor-pointer items-center justify-center gap-2 p-2
              font-medium transition
              hover:bg-slate-500/25
            "
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
          {options.map((option, index) => (
            <ListboxOption
              key={index}
              value={option}
              className="
                flex cursor-pointer items-center gap-2 p-2 transition
                hover:bg-slate-500/25
                data-active:bg-slate-500/25
              "
            >
              {({ selected }) => (
                <>
                  <CheckIcon
                    className={clsx(
                      "transition",
                      selected ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {startCase(option)}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </label>
  );
};

export default SelectMulti;

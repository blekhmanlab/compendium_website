import type { ComponentProps } from "react";
import { Select } from "@base-ui/react";
import clsx from "clsx";
import { startCase, truncate } from "lodash";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

type Props<Option extends string> = {
  label: string;
  value: Option[];
  onChange: (value: Option[]) => void;
  options: readonly Option[];
} & Omit<ComponentProps<"select">, "value" | "onChange">;

export default function SelectMulti<Option extends string>({
  label,
  value,
  onChange,
  options,
  className = "",
}: Props<Option>) {
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
      <Select.Root<Option, true>
        multiple
        value={value}
        onValueChange={(next) => onChange(next as Option[])}
      >
        <Select.Trigger
          className={clsx(
            "flex min-w-20 cursor-pointer appearance-none items-center gap-2",
            "rounded-md bg-slate-500/25 p-2 transition",
            "hover:bg-slate-500/50",
            className,
          )}
        >
          <span className="grow truncate text-left">{selected}</span>
          <ChevronDownIcon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            side="bottom"
            align="start"
            sideOffset={4}
            collisionPadding={12}
            className="z-20"
          >
            <Select.Popup
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
              <Select.List>
                {options.map((option, index) => (
                  <Select.Item
                    key={index}
                    value={option}
                    className="
                      flex cursor-pointer items-center gap-2 p-2 transition
                      hover:bg-slate-500/25
                      data-highlighted:bg-slate-500/25
                    "
                  >
                    <span className="inline-flex size-5 items-center justify-center">
                      <Select.ItemIndicator>
                        <CheckIcon className="size-4" />
                      </Select.ItemIndicator>
                    </span>
                    <Select.ItemText>{startCase(option)}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </label>
  );
}

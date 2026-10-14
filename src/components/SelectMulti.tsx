import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { Select } from "@base-ui/react";
import { useDebounceFn } from "@reactuses/core";
import clsx from "clsx";
import { truncate } from "lodash";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useChanged } from "@/util/hooks";

type Props<Id extends string> = {
  label: ReactNode;
  value: Id[];
  onChange: (value: Id[]) => void;
  options: readonly { value: Id; label?: ReactNode }[];
} & Omit<ComponentProps<"select">, "value" | "onChange">;

export default function SelectMulti<Id extends string>({
  label,
  value = [],
  onChange,
  options,
  className = "",
}: Props<Id>) {
  /** local state */
  const [_value, _setValue] = useState<Id[]>(value);

  /** update local state */
  if (useChanged(value)) _setValue(value);

  /** debounce change */
  const _onChange = useDebounceFn(onChange, 1000);

  /** set local and notify */
  const set = (value: Id[]) => {
    _setValue(value);
    _onChange.run(value);
  };

  /** selected label */
  let selected = "";
  if (value.length === 0) selected = "None";
  else if (value.length === options.length) selected = "All";
  else if (value.length === 1) {
    const option = options.find((option) => option.value === value[0]);
    selected =
      typeof option?.label === "string"
        ? truncate(option.label, { length: 15 })
        : truncate(value[0]!, { length: 15 });
  } else selected = `${value.length} selected`;

  /** are all options selected */
  const allSelected = _value.length === options.length;

  return (
    <label className="inline-flex items-center gap-2">
      <span className="flex items-center gap-1 text-right">{label}</span>
      <Select.Root<Id, true>
        multiple
        value={_value}
        onValueChange={(value) => set(value as Id[])}
      >
        <Select.Trigger
          className={clsx(
            "flex min-w-20 cursor-pointer appearance-none items-center gap-2 rounded-md bg-gray p-2 transition hover:bg-light-gray",
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
            alignItemWithTrigger={false}
          >
            <Select.Popup className="flex max-h-(--available-height) flex-col overflow-y-auto rounded-md border border-light-gray bg-gray">
              <button
                onClick={() =>
                  set(allSelected ? [] : options.map((option) => option.value))
                }
                className="gap-2 p-2 font-medium hover:bg-light-gray"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
              <Select.List>
                {options.map(({ value, label }) => (
                  <Select.Item
                    key={value}
                    value={value}
                    className="flex cursor-pointer items-center gap-2 p-2 hover:bg-light-gray data-highlighted:bg-light-gray"
                  >
                    <Select.ItemText className="grow">
                      {label ?? value}
                    </Select.ItemText>
                    <Select.ItemIndicator>
                      <CheckIcon className="size-4" />
                    </Select.ItemIndicator>
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

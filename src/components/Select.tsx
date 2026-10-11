import type { ComponentProps, ReactNode } from "react";
import { Select as BaseSelect } from "@base-ui/react";
import clsx from "clsx";
import { startCase } from "lodash";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

type Props<Option extends string> = {
  label: ReactNode;
  value: Option;
  onChange: (value: Option) => void;
  options: readonly Option[];
} & Omit<ComponentProps<"select">, "value" | "onChange">;

export default function Select<Option extends string>({
  label,
  value,
  onChange,
  options,
  className = "",
}: Props<Option>) {
  return (
    <label className="inline-flex items-center gap-2">
      <span className="flex items-center gap-1 text-right">{label}</span>
      <BaseSelect.Root<Option>
        value={value}
        onValueChange={(value) => {
          if (value !== null) onChange(value);
        }}
      >
        <BaseSelect.Trigger
          className={clsx(
            "flex min-w-20 cursor-pointer appearance-none items-center gap-2",
            "rounded-md bg-gray p-2 transition",
            "hover:bg-light-gray",
            className,
          )}
        >
          <span className="grow truncate text-left">
            {startCase(value) || "None"}
          </span>
          <ChevronDownIcon />
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner
            side="bottom"
            align="start"
            collisionPadding={12}
            className="z-20"
            alignItemWithTrigger={false}
          >
            <BaseSelect.Popup className="flex flex-col rounded-md border border-light-gray bg-gray">
              <BaseSelect.List>
                {options.map((option, index) => (
                  <BaseSelect.Item
                    key={index}
                    value={option}
                    className="flex cursor-pointer items-center gap-2 p-2 hover:bg-light-gray data-highlighted:bg-light-gray"
                  >
                    <span className="inline-flex size-5 items-center justify-center">
                      <BaseSelect.ItemIndicator>
                        <CheckIcon className="size-4" />
                      </BaseSelect.ItemIndicator>
                    </span>
                    <BaseSelect.ItemText>
                      {startCase(option) || "None"}
                    </BaseSelect.ItemText>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </label>
  );
}

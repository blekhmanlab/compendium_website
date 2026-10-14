import type { ComponentProps, ReactNode } from "react";
import { Select as BaseSelect } from "@base-ui/react";
import clsx from "clsx";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

type Props<Id extends string> = {
  label: ReactNode;
  value: Id;
  onChange: (value: Id) => void;
  options: readonly { value: Id; label?: ReactNode }[];
} & Omit<ComponentProps<"select">, "value" | "onChange">;

export default function Select<Id extends string>({
  label,
  value,
  onChange,
  options,
  className = "",
}: Props<Id>) {
  const selected = options.find((option) => option.value === value);

  return (
    <label className="inline-flex items-center gap-2">
      <span className="flex items-center gap-1 text-right">{label}</span>
      <BaseSelect.Root<Id>
        value={value}
        onValueChange={(value) => {
          if (value !== null) onChange(value);
        }}
      >
        <BaseSelect.Trigger
          className={clsx(
            "flex min-w-20 cursor-pointer appearance-none items-center gap-2 rounded-md bg-gray p-2 transition hover:bg-light-gray",
            className,
          )}
        >
          <span className="grow truncate text-left">
            {selected?.label ?? value}
          </span>
          <ChevronDownIcon />
        </BaseSelect.Trigger>

        <BaseSelect.Portal>
          <BaseSelect.Positioner
            side="bottom"
            align="start"
            sideOffset={4}
            collisionPadding={12}
            className="z-20"
            alignItemWithTrigger={false}
          >
            <BaseSelect.Popup className="flex max-h-(--available-height) flex-col overflow-y-auto rounded-md border border-light-gray bg-gray">
              <BaseSelect.List>
                {options.map(({ value, label }) => (
                  <BaseSelect.Item
                    key={value}
                    value={value}
                    className="flex cursor-pointer items-center gap-2 p-2 hover:bg-light-gray data-highlighted:bg-light-gray"
                  >
                    <BaseSelect.ItemText className="grow">
                      {label ?? value}
                    </BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator>
                      <CheckIcon className="size-4" />
                    </BaseSelect.ItemIndicator>
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

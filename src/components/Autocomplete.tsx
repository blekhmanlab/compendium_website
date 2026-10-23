import type { ComponentProps, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { Combobox } from "@base-ui/react";
import { useDebounce, useInfiniteScroll } from "@reactuses/core";
import clsx from "clsx";
import { CheckIcon, XIcon } from "lucide-react";
import { useSearch } from "@/util/hooks";

type Props<Id extends string> = {
  label: ReactNode;
  value: Id | "";
  onChange: (value: Id | "") => void;
  options: readonly { value: Id | ""; label?: ReactNode }[];
  renderOption?: (value: Id) => ReactNode;
  content?: ReactNode;
} & Omit<ComponentProps<"input">, "value" | "onChange" | "content">;

/** chunk size of results */
const chunk = 50;

export default function Autocomplete<Id extends string>({
  label,
  value,
  onChange,
  options,
  renderOption,
  placeholder = "Search",
  className = "",
  onFocus,
  content,
}: Props<Id>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  /** search input */
  const [_search, setSearch] = useState("");
  /** debounced search input */
  const search = useDebounce(_search, 300);
  /** max number of results to render */
  const [limit, setLimit] = useState(chunk);

  /** option search values */
  const list = useMemo(
    () => options.map(({ value }) => ({ value })),
    [options],
  );

  /** load more items on scroll */
  useInfiniteScroll(
    () => scrollRef.current,
    () => setLimit((prev) => prev + chunk),
    { distance: 16 },
  );

  /** search results */
  const [matches, status] = useSearch(list, ["value"], search);

  /** items to show in dropdown */
  const items = matches.slice(0, limit).map((item) => item.value);

  /** get item label */
  const getLabel = (id: Id) =>
    renderOption?.(id) ??
    options.find((option) => option.value === id)?.label ??
    id ??
    "-";

  return (
    <label className="flex items-center gap-2">
      <span className="flex items-center gap-1 text-right">{label}</span>
      <Combobox.Root<Id>
        items={items}
        filter={null}
        value={value || null}
        onValueChange={(value) => onChange(value || "")}
        onInputValueChange={(value) => {
          setSearch(value);
          setLimit(chunk);
        }}
        onOpenChange={() => setLimit(chunk)}
      >
        <Combobox.InputGroup
          data-filled={value ? "" : undefined}
          className={clsx(
            "group relative flex min-w-20 rounded-md bg-gray transition hover:bg-light-gray",
            className,
          )}
        >
          <div className="pointer-events-none absolute inset-0 right-10 overflow-hidden p-2 whitespace-nowrap group-focus-within:opacity-0">
            {getLabel(value as Id)}
          </div>
          <Combobox.Input
            placeholder={placeholder}
            className="w-full min-w-0 p-2 pr-10 opacity-0 group-not-data-filled:opacity-100 group-focus-within:opacity-100"
            onFocus={onFocus}
          />
          {value !== "" && (
            <Combobox.Clear
              aria-label="Clear"
              className="absolute top-px right-px size-10 cursor-pointer"
            >
              <XIcon className="size-4" />
            </Combobox.Clear>
          )}
        </Combobox.InputGroup>
        <Combobox.Portal>
          <Combobox.Positioner
            side="bottom"
            align="start"
            sideOffset={4}
            collisionPadding={12}
            className="z-20"
          >
            <Combobox.Popup
              ref={scrollRef}
              className="flex max-h-(--available-height) w-(--anchor-width) flex-col overflow-auto rounded-md border border-light-gray bg-gray"
            >
              {content || (
                <Combobox.Empty className="p-2 empty:hidden">
                  No matches
                </Combobox.Empty>
              )}
              <Combobox.List>
                {(id: Id) => (
                  <Combobox.Item
                    key={id}
                    value={id}
                    className={clsx(
                      "flex cursor-pointer items-center gap-2 p-2 hover:bg-light-gray data-highlighted:bg-light-gray",
                      status === "loading" && "opacity-50",
                    )}
                  >
                    <span className="grow">{getLabel(id)}</span>
                    <Combobox.ItemIndicator>
                      <CheckIcon className="size-4" />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </label>
  );
}

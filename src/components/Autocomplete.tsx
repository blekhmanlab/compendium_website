import type { ComponentProps, ReactNode } from "react";
import type { Remote } from "comlink";
import type * as SearchAPI from "@/util/search";
import { useCallback, useMemo, useState } from "react";
import { Combobox } from "@base-ui/react";
import { useDebounce } from "@reactuses/core";
import clsx from "clsx";
import { CheckIcon, XIcon } from "lucide-react";
import SearchWorker from "@/util/search?worker";
import { useWorker } from "@/util/worker";

/** max number of results to render */
const limit = 100;

type Props<Id extends string> = {
  label: ReactNode;
  value: Id | "";
  onChange: (value: Id | "") => void;
  options: readonly { value: Id | ""; label?: ReactNode }[];
  renderOption?: (value: Id) => ReactNode;
  status?: ReactNode;
} & Omit<ComponentProps<"input">, "value" | "onChange">;

export default function Autocomplete<Id extends string>({
  label,
  value,
  onChange,
  options,
  renderOption,
  placeholder = "Search",
  className = "",
  onFocus,
  status,
}: Props<Id>) {
  /** search input */
  const [_search, setSearch] = useState("");
  /** debounced search input */
  const search = useDebounce(_search, 300);

  /** option search values */
  const list = useMemo(
    () => options.map(({ value }) => ({ value })),
    [options],
  );

  /** exact search results */
  const [exactMatches] = useWorker(
    SearchWorker,
    useCallback(
      (worker: Remote<typeof SearchAPI>) =>
        worker.exactSearch(list, ["value"], search) as Promise<typeof list>,
      [list, search],
    ),
  );

  /** items to show in dropdown */
  const items = (search.trim() ? (exactMatches ?? []) : list)
    .slice(0, limit)
    .map((item) => item.value);

  /** get item label */
  const getLabel = (id: Id) =>
    renderOption?.(id) ??
    options.find((option) => option.value === id)?.label ??
    id ??
    "-";

  return (
    <label className="inline-flex items-center gap-2">
      <span className="flex items-center gap-1 text-right">{label}</span>
      <Combobox.Root<Id>
        items={items}
        filter={null}
        value={value || null}
        onValueChange={(value) => onChange(value || "")}
        onInputValueChange={setSearch}
      >
        <Combobox.InputGroup
          data-filled={value ? "" : undefined}
          className={clsx(
            "group relative flex min-w-20 rounded-md bg-gray transition hover:bg-light-gray",
            className,
          )}
        >
          <div className="pointer-events-none absolute inset-2 right-10 overflow-hidden group-focus-within:opacity-0">
            {getLabel(value as Id)}
          </div>
          <Combobox.Input
            placeholder={placeholder}
            className="min-w-0 p-2 pr-10 opacity-0 group-not-data-filled:opacity-100 group-focus-within:opacity-100"
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
            <Combobox.Popup className="flex max-h-(--available-height) flex-col overflow-y-auto rounded-md border border-light-gray bg-gray">
              {status || (
                <Combobox.Empty className="p-2 empty:hidden">
                  No matches
                </Combobox.Empty>
              )}
              <Combobox.List>
                {(id: Id) => (
                  <Combobox.Item
                    key={id}
                    value={id}
                    className="flex cursor-pointer items-center gap-2 p-2 hover:bg-light-gray data-highlighted:bg-light-gray"
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

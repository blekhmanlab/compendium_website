import type { ReactNode } from "react";
import clsx from "clsx";
import { CheckIcon } from "lucide-react";
import Tooltip from "@/components/Tooltip";

type Props = {
  tooltip: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

export default function CheckButton({
  tooltip,
  checked,
  onChange,
  className,
}: Props) {
  return (
    <Tooltip content={tooltip} button>
      <button
        className={clsx(
          "size-6 rounded-md border border-light-gray bg-gray p-0! hover:bg-light-gray",
          className,
        )}
        role="checkbox"
        aria-checked={checked ? "true" : "false"}
        onClick={() => onChange(!checked)}
      >
        <CheckIcon className={checked ? "opacity-100" : "opacity-0"} />
      </button>
    </Tooltip>
  );
}

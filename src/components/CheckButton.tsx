import type { ReactNode } from "react";
import { CheckIcon } from "lucide-react";
import Tooltip from "@/components/Tooltip";

type Props = {
  tooltip: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function CheckButton({ tooltip, checked, onChange }: Props) {
  return (
    <Tooltip content={tooltip} button>
      <button
        className="size-6 cursor-pointer rounded-md bg-gray hover:bg-light-gray"
        role="checkbox"
        aria-checked={checked ? "true" : "false"}
        onClick={() => onChange(!checked)}
      >
        <CheckIcon className={checked ? "opacity-100" : "opacity-0"} />
      </button>
    </Tooltip>
  );
}

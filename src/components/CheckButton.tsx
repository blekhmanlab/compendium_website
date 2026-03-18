import { CheckIcon } from "lucide-react";
import Button from "@/components/Button";

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const CheckButton = ({ label, checked, onChange }: Props) => {
  return (
    <Button
      className="
        size-6 cursor-pointer rounded-md bg-slate-500/25
        hover:bg-slate-500/50
      "
      role="checkbox"
      data-tooltip={label}
      aria-checked={checked ? "true" : "false"}
      onClick={() => onChange(!checked)}
    >
      <CheckIcon className={checked ? "opacity-100" : "opacity-0"} />
    </Button>
  );
};

export default CheckButton;

import CheckIcon from "@/assets/check.svg?react";
import Button from "@/components/Button";
import classes from "./CheckButton.module.css";

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const CheckButton = ({ label, checked, onChange }: Props) => {
  return (
    <Button
      className={classes.button}
      role="checkbox"
      data-tooltip={label}
      aria-checked={checked ? "true" : "false"}
      onClick={() => onChange(!checked)}
    >
      {checked ? <CheckIcon /> : <></>}
    </Button>
  );
};

export default CheckButton;

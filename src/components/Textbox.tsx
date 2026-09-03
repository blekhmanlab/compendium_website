import type { ComponentProps } from "react";
import clsx from "clsx";
import { XIcon } from "lucide-react";

type Single = { multi?: false } & Omit<ComponentProps<"input">, "onChange">;
type Multi = { multi: true } & Omit<ComponentProps<"textarea">, "onChange">;

type Base = {
  value: string;
  onChange: (value: string) => void;
};

type Props = Base & (Single | Multi);

export default function Textbox({
  multi,
  value,
  onChange,
  className,
  ...props
}: Props) {
  return (
    <div className={clsx("relative flex", className)}>
      {multi ? (
        <textarea
          className="grow rounded-md bg-gray p-2 pr-10 transition hover:bg-light-gray"
          {...(props as ComponentProps<"textarea">)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      ) : (
        <input
          type="text"
          className="grow rounded-md bg-gray p-2 pr-10 transition hover:bg-light-gray"
          {...(props as ComponentProps<"input">)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      )}
      <button
        className="absolute top-px right-px size-10"
        onClick={() => onChange("")}
        aria-label="Clear"
      >
        <XIcon />
      </button>
    </div>
  );
}

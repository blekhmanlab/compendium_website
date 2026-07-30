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
    <div
      className={clsx(
        "relative flex rounded-md bg-gray transition hover:bg-light-gray",
        className,
      )}
    >
      {multi ? (
        <textarea
          className="grow mask-[linear-gradient(to_right,black_calc(100%-(--spacing(12))),transparent)] p-2 pr-10 whitespace-pre"
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
          className="grow p-2 pr-10"
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

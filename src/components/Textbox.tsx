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

const Textbox = ({ multi, value, onChange, className, ...props }: Props) => (
  <div className={clsx("relative flex", className)}>
    {multi ? (
      <textarea
        className="
          grow rounded-md bg-slate-500/25 px-4 py-2 pr-8 text-inherit transition
          hover:bg-slate-500/50
        "
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
        className="
          grow rounded-md bg-slate-500/25 px-4 py-2 pr-8 transition
          hover:bg-slate-500/50
        "
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
      className="
        absolute top-0 right-0 flex size-10 cursor-pointer items-center
        justify-center
      "
      data-tooltip="Clear"
      onClick={() => onChange("")}
    >
      <XIcon />
    </button>
  </div>
);

export default Textbox;

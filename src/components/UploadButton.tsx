import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import { useEventListener } from "@reactuses/core";
import clsx from "clsx";
import { UploadIcon } from "lucide-react";
import Button from "@/components/Button";

type Props = {
  /**
   * formats to accept. array of mime types or extensions w/ dot.
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
   */
  accept?: string[];
  /** callback with file */
  onUpload: (file: File, name: string, ext: string) => void;
} & ComponentProps<typeof Button>;

/** file dialog or drag & drop button */
export default function UploadButton({
  onUpload,
  accept = [],
  className,
  children,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /** filename */
  const [name, setName] = useState("");
  /** extension */
  const [ext, setExt] = useState("");

  /** upload file */
  const upload = async (target: HTMLInputElement | DataTransfer | null) => {
    const file = (target?.files || [])[0];
    if (!file) return;

    /** extract filename parts */
    const [, name = "", ext = ""] = file.name.match(/(.+)\.(.+)/) || [];

    setName(name);
    setExt(ext);

    /** pass upload to parent */
    onUpload(file, name, ext);

    /** reset file input */
    if (inputRef.current) inputRef.current.value = "";
  };

  /** is dragging */
  const [drag, setDrag] = useState(false);

  /** attach handlers to target */
  useEventListener("dragenter", () => setDrag(true), buttonRef);
  useEventListener("dragleave", () => setDrag(false), buttonRef);
  useEventListener("dragover", (event) => event.preventDefault(), buttonRef);
  useEventListener(
    "drop",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setDrag(false);
      upload(event.dataTransfer);
    },
    buttonRef,
  );

  /** visual feedback for drag state */
  const dragClassName =
    "outline-2 outline-offset-2 outline-white outline-dashed";

  useEffect(() => {
    if (!buttonRef.current) return;
    if (drag) buttonRef.current.classList.add(...dragClassName.split(" "));
    else buttonRef.current.classList.remove(...dragClassName.split(" "));
  }, [drag]);

  return (
    <>
      <Button
        ref={buttonRef}
        className={clsx(drag && dragClassName, className)}
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon />
        {children}
      </Button>
      {[name, ext].filter(Boolean).join(".")}
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        style={{ display: "none" }}
        onChange={(event) => upload(event.target)}
      />
    </>
  );
}

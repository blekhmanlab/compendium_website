import type { ComponentProps, Ref } from "react";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useEventListener } from "@reactuses/core";
import clsx from "clsx";
import { UploadIcon } from "lucide-react";
import Button from "@/components/Button";

type Props = {
  ref?: Ref<Handle>;
  /**
   * formats to accept. array of mime types or extensions w/ dot.
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
   */
  accept?: string[];
  /** callback with file */
  onUpload: (file: File, name: string, ext: string) => void;
} & Omit<ComponentProps<typeof Button>, "ref">;

export type Handle = { setUpload: (url: string) => void };

/** file dialog or drag & drop button */
export default function UploadButton({
  ref,
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
  const upload = useCallback(
    async (file: File) => {
      /** extract filename parts */
      const [, name = "", ext = ""] = file.name.match(/(.+)\.(.+)/) || [];

      setName(name);
      setExt(ext);

      /** pass upload to parent */
      onUpload(file, name, ext);

      /** reset file input */
      if (inputRef.current) inputRef.current.value = "";
    },
    [onUpload],
  );

  /** programmatically set upload from outside component */
  const setUpload = useCallback(
    async (url: string) => {
      const blob = await (await fetch(url)).blob();
      console.log(blob);
      const name = url.split("/").pop() || "";
      const file = new File([blob], name, { type: blob.type });
      upload(file);
    },
    [upload],
  );
  useImperativeHandle(ref, () => ({ setUpload }), [setUpload]);

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
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      upload(file);
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
        {[name, ext].filter(Boolean).join(".") || children}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          upload(file);
        }}
      />
    </>
  );
}

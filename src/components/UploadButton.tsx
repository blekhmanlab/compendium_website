import type { ChangeEvent, ComponentProps, DragEvent } from "react";
import { useRef, useState } from "react";
import clsx from "clsx";
import UploadIcon from "@/assets/upload.svg?react";
import Button from "@/components/Button";
import classes from "./UploadButton.module.css";

type Props = {
  /**
   * formats to accept. array of mime types or extensions w/ dot.
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
   */
  accept?: string[];
  /** callback with file */
  onUpload: (file: File, filename: string, extension: string) => void;
} & ComponentProps<typeof Button>;

/** file dialog or drag & drop button */
const UploadButton = ({
  onUpload,
  accept = [],
  className,
  ...props
}: Props) => {
  const ref = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");

  /** dragging */
  const [drag, setDrag] = useState(false);

  /** upload file */
  const upload = async (target: HTMLInputElement | DataTransfer | null) => {
    const file = (target?.files || [])[0];
    if (!file) return;

    setName(file.name);

    /** extract filename parts */
    const [, filename = "", extension = ""] =
      file.name.match(/(.+)\.(.+)/) || [];

    /** pass upload to parent */
    onUpload(file, filename, extension);

    /** reset file input */
    if (ref.current) ref.current.value = "";
  };

  /** on file input change */
  const onChange = (event: ChangeEvent<HTMLInputElement>) =>
    upload(event.target);

  /** on button click, click hidden file input */
  const onClick = () => ref.current?.click();

  /** on button file drop */
  const onDrop = (event: DragEvent) => {
    setDrag(false);
    upload(event.dataTransfer);
  };

  return (
    <div className={classes.container}>
      <Button
        className={clsx(drag && classes.drag, className)}
        icon={UploadIcon}
        onClick={onClick}
        onDragEnter={() => setDrag(true)}
        onDragLeave={() => setDrag(false)}
        onDragOver={(event: DragEvent) => event.preventDefault()}
        onDrop={(event: DragEvent) => {
          event.preventDefault();
          event.stopPropagation();
          onDrop(event);
        }}
        {...props}
      />

      {name}

      <input
        ref={ref}
        type="file"
        accept={accept.join(",")}
        style={{ display: "none" }}
        onChange={onChange}
      />
    </div>
  );
};

export default UploadButton;

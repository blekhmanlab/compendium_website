import type { ReactNode } from "react";
import { isValidElement } from "react";
import { Popover } from "@base-ui/react";
import clsx from "clsx";

type Props = {
  /** tooltip content */
  content: ReactNode;
  /** whether trigger renders button element */
  button?: boolean;
  /** class on popup box */
  className?: string;
  /** tooltip trigger */
  children: ReactNode;
};

/** popup of content on hover or click */
export default function Tooltip({
  content,
  button = false,
  children,
  className,
}: Props) {
  /** prevent if trigger disabled */
  if (
    isValidElement(children) &&
    typeof children.props === "object" &&
    children.props !== null &&
    "aria-disabled" in children.props &&
    children.props["aria-disabled"]
  )
    return children;

  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={100}
        nativeButton={button}
        render={
          isValidElement(children) ? (
            /** if element, render element */
            children
          ) : (
            /** if text, wrap and give hoverable indication */
            <span className="underline decoration-dotted underline-offset-4">
              {children}
            </span>
          )
        }
      />
      <Popover.Portal>
        <Popover.Positioner
          side="top"
          sideOffset={10}
          collisionPadding={10}
          className="z-30"
          collisionAvoidance={{
            side: "flip",
            align: "shift",
            fallbackAxisSide: "none",
          }}
        >
          <Popover.Popup
            className={clsx(
              "max-h-(--available-height) w-max max-w-[min(var(--available-width),--spacing(100))] overflow-y-auto rounded-md bg-white p-3 leading-relaxed text-dark-gray transition data-closed:opacity-0 data-ending-style:opacity-0 data-open:opacity-100 data-starting-style:opacity-0 [&_a]:text-secondary [&_a]:underline [&_a]:hover:text-primary",

              className,
            )}
          >
            <Popover.Arrow className="[clip-path:polygon(-100%_-10%,201%_-10%,100%_100%,0_100%)] data-[side=bottom]:bottom-full data-[side=bottom]:rotate-180 data-[side=left]:left-full data-[side=left]:-rotate-90 data-[side=right]:right-full data-[side=right]:rotate-90 data-[side=top]:top-full">
              <div className="size-2 -translate-y-1/2 rotate-45 bg-white" />
            </Popover.Arrow>
            {content}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

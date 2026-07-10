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
              "max-h-(--available-height) w-max max-w-[min(var(--available-width),--spacing(100))] overflow-y-auto rounded-md border border-light-gray bg-gray p-4 leading-loose transition trim data-closed:opacity-0 data-ending-style:opacity-0 data-open:opacity-100 data-starting-style:opacity-0",

              className,
            )}
          >
            <Popover.Arrow
              render={(props, { side }) => (
                <div
                  {...props}
                  className={clsx(
                    "size-3 border border-light-gray bg-gray [clip-path:polygon(0%_0%,100%_0%,100%_100%,0_0%)]",
                    side === "top" &&
                      "top-full -translate-y-[calc(50%+1px)] rotate-135",
                    side === "bottom" &&
                      "bottom-full translate-y-[calc(50%+1px)] rotate-315",
                    side === "left" &&
                      "left-full -translate-x-[calc(50%+1px)] rotate-45",
                    side === "right" &&
                      "right-full translate-x-[calc(50%+1px)] rotate-225",
                  )}
                />
              )}
            />
            {content}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

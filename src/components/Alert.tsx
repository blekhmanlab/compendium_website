import type { ReactNode } from "react";
import clsx from "clsx";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from "lucide-react";

type Props = {
  type: Type;
  className?: string;
  children: ReactNode;
};

type Type = keyof typeof types;

const types = {
  loading: {
    className: "bg-white/10",
    icon: <LoaderCircleIcon className="shrink-0 animate-spin text-white" />,
  },
  success: {
    className: "bg-success/10",
    icon: <CircleCheckIcon className="shrink-0 text-success" />,
  },
  info: {
    className: "bg-info/10",
    icon: <InfoIcon className="shrink-0 text-info" />,
  },
  warn: {
    className: "bg-warn/10",
    icon: <CircleAlertIcon className="shrink-0 text-warn" />,
  },
  error: {
    className: "bg-error/10",
    icon: <TriangleAlertIcon className="shrink-0 text-error" />,
  },
};

export default function Alert({ type, children, className }: Props) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center gap-4 rounded-md p-4",
        types[type]?.className,
        className,
      )}
    >
      {types[type]?.icon}
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

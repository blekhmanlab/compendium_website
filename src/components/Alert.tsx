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
    icon: <LoaderCircleIcon className="animate-spin text-white" />,
  },
  success: {
    className: "bg-success/10",
    icon: <CircleCheckIcon className="text-success" />,
  },
  info: {
    className: "bg-info/10",
    icon: <InfoIcon className="text-info" />,
  },
  warn: {
    className: "bg-warn/10",
    icon: <CircleAlertIcon className="text-warn" />,
  },
  error: {
    className: "bg-error/10",
    icon: <TriangleAlertIcon className="text-error" />,
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
      {children}
    </div>
  );
}

type AlertsProps = Partial<
  Record<Type, (ReactNode | false | null | undefined)[]>
>;

export function Alerts(props: AlertsProps) {
  const entries = Object.entries(props).flatMap(([type, contents]) =>
    contents
      .filter((content) => !!content)
      .map((content) => ({ type, content })),
  );

  if (entries.length === 0) return null;

  return (
    <div
      className={clsx(
        "grid gap-4",
        entries.length === 1 && "grid-cols-1",
        entries.length === 2 && "grid-cols-2 max-sm:grid-cols-1",
        entries.length >= 3 &&
          "grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1",
      )}
    >
      {entries.map(({ type, content }, index) => (
        <Alert key={index} type={type as Type}>
          {content}
        </Alert>
      ))}
    </div>
  );
}

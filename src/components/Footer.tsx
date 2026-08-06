import Tooltip from "@/components/Tooltip";
import { useSite } from "@/pages/home/state";

export default function Footer() {
  const site = useSite();

  return (
    <footer className="relative isolate flex flex-row items-center justify-between gap-8 bg-linear-to-r from-primary-dark to-secondary-dark p-8 max-md:flex-col">
      <p className="max-w-[unset]">
        A project of the{" "}
        {site.labs.map((lab, index, array) => (
          <span key={index}>
            <a href={lab.url}>{lab.text}</a>
            {index < array.length - 1 && " "}
          </span>
        ))}
        , in affiliation with...
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        {site.groups.map((group, index) => (
          <Tooltip key={index} content={group.text}>
            <a href={group.url}>
              <img
                src={group.image}
                alt={group.text}
                style={{ maxHeight: "40px" }}
              />
            </a>
          </Tooltip>
        ))}
      </div>
    </footer>
  );
}

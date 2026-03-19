import clsx from "clsx";
import {
  BarChartHorizontalIcon,
  DatabaseIcon,
  EarthIcon,
  EyeIcon,
  MicroscopeIcon,
  PackageIcon,
  TableIcon,
} from "lucide-react";
import Placeholder from "@/components/Placeholder";
import { useData } from "@/pages/home/data";
import { formatBytes, formatDate, formatNumber } from "@/util/string";

const Overview = () => {
  /** get global state */
  const metadata = useData((state) => state.metadata);

  /** round down to nearest large amount */
  const samplesRound = Math.floor((metadata?.samples || 0) / 10000) * 10000;

  const tiles = [
    {
      icon: <MicroscopeIcon />,
      className: "text-primary",
      text: (
        <>
          {formatNumber(metadata?.samples, false)} samples
          <br />
          {formatNumber(metadata?.projects)} projects
        </>
      ),
    },
    {
      icon: <BarChartHorizontalIcon />,
      className: "text-primary",
      text: (
        <>
          {formatNumber(metadata?.classes)} classes
          <br />
          {formatNumber(metadata?.phyla)} phyla
        </>
      ),
    },
    {
      icon: <EarthIcon />,
      className: "text-primary",
      text: (
        <>
          {formatNumber(metadata?.countries)} countries
          <br />
          {formatNumber(metadata?.regions)} regions
        </>
      ),
    },
    {
      icon: <DatabaseIcon />,
      className: "text-secondary",
      text: (
        <>
          Ver. {metadata?.version}
          <br />
          {formatDate(metadata?.date)}
        </>
      ),
    },

    {
      icon: <EyeIcon />,
      className: "text-secondary",
      text: (
        <>
          {formatNumber(metadata?.downloads)} downloads
          <br />
          {formatNumber(metadata?.views)} views
        </>
      ),
    },
    {
      icon: <TableIcon />,
      className: "text-secondary",
      text: (
        <>
          {formatBytes(metadata?.size)} download
          <br />
          {formatBytes(metadata?.uncompressed)} uncomp.
        </>
      ),
    },
  ];

  return (
    <section>
      <h2>Overview</h2>

      <p>
        This dataset includes{" "}
        {samplesRound ? "over " + formatNumber(samplesRound) : "thousands of"}{" "}
        samples of publicly available 16S rRNA amplicon sequencing data, all
        processed using the same pipeline and reference database.
      </p>

      {metadata ? (
        <div
          className="
            grid grid-cols-3 gap-10
            max-md:grid-cols-2
            max-sm:grid-cols-1
          "
        >
          {tiles.map(({ className, icon, text }, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-4 text-center"
            >
              <span
                className={clsx(
                  `
                    grid size-16 place-items-center rounded-full bg-current/25
                    *:size-8 *:text-white
                    **:stroke-1
                  `,
                  className,
                )}
              >
                {icon}
              </span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      ) : (
        <Placeholder className="h-100">Loading metadata...</Placeholder>
      )}

      <p>
        This website lets you <b>search</b> and <b>explore</b> the data at a
        high level before downloading.{" "}
        <a href={import.meta.env.VITE_R_PACKAGE} target="_blank">
          <PackageIcon />
          Use the R package
        </a>{" "}
        to do all kinds of filtering and analyses with the data!
      </p>
    </section>
  );
};

export default Overview;

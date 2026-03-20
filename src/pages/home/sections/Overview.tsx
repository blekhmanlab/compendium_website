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
import { useData } from "@/pages/home/state";
import { formatBytes, formatDate, formatNumber } from "@/util/string";

const Overview = () => {
  /** get global state */
  const meta = useData((state) => state.meta);

  /** round down to nearest large amount */
  const samplesRound = Math.floor((meta?.samples || 0) / 10000) * 10000;

  const tiles = [
    {
      icon: <MicroscopeIcon />,
      className: "text-primary",
      text: (
        <>
          {formatNumber(meta?.samples, false)} samples
          <br />
          {formatNumber(meta?.projects)} projects
        </>
      ),
    },
    {
      icon: <BarChartHorizontalIcon />,
      className: "text-primary",
      text: (
        <>
          {formatNumber(meta?.classes)} classes
          <br />
          {formatNumber(meta?.phyla)} phyla
        </>
      ),
    },
    {
      icon: <EarthIcon />,
      className: "text-primary",
      text: (
        <>
          {formatNumber(meta?.countries)} countries
          <br />
          {formatNumber(meta?.regions)} regions
        </>
      ),
    },
    {
      icon: <DatabaseIcon />,
      className: "text-secondary",
      text: (
        <>
          Ver. {meta?.version}
          <br />
          {formatDate(meta?.date)}
        </>
      ),
    },

    {
      icon: <EyeIcon />,
      className: "text-secondary",
      text: (
        <>
          {formatNumber(meta?.downloads)} downloads
          <br />
          {formatNumber(meta?.views)} views
        </>
      ),
    },
    {
      icon: <TableIcon />,
      className: "text-secondary",
      text: (
        <>
          {formatBytes(meta?.size)} download
          <br />
          {formatBytes(meta?.uncompressed)} uncomp.
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

      {meta ? (
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
        <div className="placeholder">Loading metadata</div>
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

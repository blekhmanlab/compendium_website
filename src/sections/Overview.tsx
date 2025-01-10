import BarsIcon from "@/assets/bars.svg?react";
import DatabaseIcon from "@/assets/database.svg?react";
import EarthIcon from "@/assets/earth.svg?react";
import EyeIcon from "@/assets/eye.svg?react";
import MicroscopeIcon from "@/assets/microscope.svg?react";
import PackageIcon from "@/assets/package.svg?react";
import TableIcon from "@/assets/table.svg?react";
import Placeholder from "@/components/Placeholder";
import { useData } from "@/data";
import { formatBytes, formatDate, formatNumber } from "@/util/string";
import classes from "./Overview.module.css";

const Overview = () => {
  /** get global state */
  const metadata = useData((state) => state.metadata);

  /** round down to nearest large amount */
  const samplesRound = Math.floor((metadata?.samples || 0) / 10000) * 10000;

  const tiles = [
    {
      icon: MicroscopeIcon,
      text: (
        <>
          {formatNumber(metadata?.samples, false)} samples
          <br />
          {formatNumber(metadata?.projects)} projects
        </>
      ),
    },
    {
      icon: BarsIcon,
      text: (
        <>
          {formatNumber(metadata?.classes)} classes
          <br />
          {formatNumber(metadata?.phyla)} phyla
        </>
      ),
    },
    {
      icon: EarthIcon,
      text: (
        <>
          {formatNumber(metadata?.countries)} countries
          <br />
          {formatNumber(metadata?.regions)} regions
        </>
      ),
    },
    {
      icon: DatabaseIcon,
      text: (
        <>
          Ver. {metadata?.version}
          <br />
          {formatDate(metadata?.date)}
        </>
      ),
    },

    {
      icon: EyeIcon,
      text: (
        <>
          {formatNumber(metadata?.downloads)} downloads
          <br />
          {formatNumber(metadata?.views)} views
        </>
      ),
    },
    {
      icon: TableIcon,
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
        <div className={classes.tiles}>
          {tiles.map(({ icon, text }, index) => {
            /** icon color */
            const percent = (index / (tiles.length - 1)) * 100;
            const color = `color-mix(in hsl, var(--primary-light), ${percent}% var(--secondary-light))`;

            return (
              <div key={index} className={classes.tile}>
                {icon({ style: { color } })}
                <span>{text}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <Placeholder height={300}>Loading metadata...</Placeholder>
      )}

      <hr />

      <p>
        This website lets you <b>search</b> and <b>explore</b> the data at a
        high level before downloading.{" "}
        <a href={import.meta.env.VITE_R_PACKAGE} target="_blank">
          <PackageIcon className="inline-svg" />
          Use the R package
        </a>{" "}
        to do all kinds of filtering and analyses with the data!
      </p>
    </section>
  );
};

export default Overview;

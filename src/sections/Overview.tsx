import { ReactComponent as ClassesIcon } from "@/assets/bars.svg";
import { ReactComponent as SizeIcon } from "@/assets/database.svg";
import { ReactComponent as CountriesIcon } from "@/assets/earth.svg";
import { ReactComponent as SamplesIcon } from "@/assets/microscope.svg";
import Placeholder from "@/components/Placeholder";
import { useData } from "@/data";
import { formatNumber } from "@/util/math";
import classes from "./Overview.module.css";

const Overview = () => {
  /** get global state */
  const metadata = useData((state) => state.metadata);

  /** round down to nearest large amount */
  const samplesRound = Math.floor((metadata?.samples || 0) / 10000) * 10000;

  const tiles = [
    {
      icon: SamplesIcon,
      text: (
        <>
          {formatNumber(metadata?.samples)} samples
          <br />
          {formatNumber(metadata?.projects)} projects
        </>
      ),
    },
    {
      icon: ClassesIcon,
      text: (
        <>
          {formatNumber(metadata?.classes)} classes
          <br />
          {formatNumber(metadata?.phyla)} phyla
        </>
      ),
    },
    {
      icon: CountriesIcon,
      text: (
        <>
          {formatNumber(metadata?.countries)} countries
          <br />
          {formatNumber(metadata?.regions)} regions
        </>
      ),
    },
    {
      icon: SizeIcon,
      text: (
        <>
          Ver. {metadata?.version}
          <br />
          {(new Date(metadata?.date || "") || new Date()).toLocaleString(
            undefined,
            { dateStyle: "medium" },
          )}
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
        <Placeholder height={100}>Loading metadata...</Placeholder>
      )}
    </section>
  );
};

export default Overview;

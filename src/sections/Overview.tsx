import { ReactComponent as ClassesIcon } from "@/assets/bars.svg";
import { ReactComponent as SizeIcon } from "@/assets/database.svg";
import { ReactComponent as CountriesIcon } from "@/assets/earth.svg";
import { ReactComponent as SamplesIcon } from "@/assets/pipette.svg";
import { useData } from "@/data";
import classes from "./Overview.module.css";

const Overview = () => {
  const metadata = useData((state) => state.metadata);

  /** round down to nearest large amount */
  const samplesRound = Math.floor((metadata?.samples || 0) / 10000) * 10000;

  const tiles = [
    {
      icon: SamplesIcon,
      text: (
        <>
          {(metadata?.samples || 0).toLocaleString()} samples
          <br />
          {(metadata?.projects || 0).toLocaleString()} projects
        </>
      ),
    },
    {
      icon: ClassesIcon,
      text: (
        <>
          {(metadata?.classes || 0).toLocaleString()} classes
          <br />
          {(metadata?.phyla || 0).toLocaleString()} phyla
        </>
      ),
    },
    {
      icon: CountriesIcon,
      text: (
        <>
          {(metadata?.countries || 0).toLocaleString()} countries
          <br />
          {(metadata?.regions || 0).toLocaleString()} regions
        </>
      ),
    },
    {
      icon: SizeIcon,
      text: (
        <>
          v{metadata?.version}
          <br />
          {metadata?.date}
        </>
      ),
    },
  ];

  return (
    <section>
      <h2>Overview</h2>

      <p>
        Our dataset includes over {samplesRound.toLocaleString()} samples of
        publicly available 16S rRNA amplicon sequencing data, all processed
        using the same pipeline and reference database.
      </p>

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
    </section>
  );
};

export default Overview;

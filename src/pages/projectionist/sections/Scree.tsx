import ScreeChart from "@/pages/projectionist/sections/ScreeChart";
import { SelectOrdination } from "@/pages/projectionist/sections/Selections";
import { useData } from "@/pages/projectionist/state";

/** scree plot section */
const Scree = () => {
  /** get state */
  const scree = useData((state) => state.scree);
  const ordination = useData((state) => state.ordination);

  /** selected data */
  const data = scree?.[ordination ?? ""];

  if (!data) return null;

  const { explained, cumulative } = data;

  return (
    <section className="width-lg">
      <h2>Scree Plots</h2>

      <div className="flex flex-wrap items-center justify-center gap-8">
        <SelectOrdination />
      </div>

      <div
        className="
          grid w-full grid-cols-2 gap-8
          max-md:grid-cols-1
        "
      >
        <ScreeChart yLabel="Eigenvalue" type="bar" data={explained} />
        <ScreeChart
          yLabel="Cumulative Explained Variance"
          type="line"
          data={cumulative}
        />
      </div>
    </section>
  );
};

export default Scree;

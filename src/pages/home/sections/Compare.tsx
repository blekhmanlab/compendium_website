import ConeIcon from "@/assets/cone.svg?react";
import Button from "@/components/Button";

const Compare = () => (
  <section>
    <h2>Compare</h2>

    <p>
      Compare your data to ours with the <i>Projectionist</i> tool.
    </p>

    <Button
      icon={ConeIcon}
      design="big"
      to="/projectionist"
      data-tooltip="Learn more about the methods and significance behind this project."
    >
      Projectionist
    </Button>
  </section>
);

export default Compare;

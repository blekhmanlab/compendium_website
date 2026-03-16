import { ConeIcon } from "lucide-react";
import Button from "@/components/Button";

const Compare = () => (
  <section>
    <h2>Compare</h2>

    <p>
      Compare your data to ours with the <i>Projectionist</i> tool.
    </p>

    <Button icon={<ConeIcon />} design="big" to="/projectionist">
      Projectionist
    </Button>
  </section>
);

export default Compare;

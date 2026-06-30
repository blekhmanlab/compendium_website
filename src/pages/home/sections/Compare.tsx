import { ConeIcon } from "lucide-react";
import Button from "@/components/Button";

export default function Compare() {
  return (
    <section>
      <h2>Compare</h2>

      <p>
        Compare your data to ours with the <i>Projectionist</i> tool.
      </p>

      <Button design="accent" to="/projectionist">
        <ConeIcon />
        Projectionist
      </Button>
    </section>
  );
}

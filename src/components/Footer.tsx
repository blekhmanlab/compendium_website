import Tooltip from "@/components/Tooltip";
import chicago from "../assets/chicago.png";
import colorado from "../assets/colorado.png";
import minnesota from "../assets/minnesota.png";

export default function Footer() {
  return (
    <footer className="flex flex-row justify-between gap-8 bg-linear-to-r from-fuchsia-950 to-indigo-950 p-8 max-md:flex-col max-md:items-center">
      <p>
        A project of the <a href="http://blekhmanlab.org/">Blekhman Lab</a>,{" "}
        <a href="http://greenelab.com/">Greene Lab</a>,{" "}
        <a href="https://seandavi.github.io/">Davis Lab</a>, and{" "}
        <a href="https://albert-lab.org/">Albert Lab</a>, in affiliation with...
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <Tooltip
          content="University of Chicago | Section of Genetic Medicine"
          button={false}
        >
          <a href="https://medicine.uchicago.edu/sections/genetic-medicine/">
            <img
              src={chicago}
              alt="University of Chicago logo"
              style={{ maxHeight: "25px" }}
            />
          </a>
        </Tooltip>
        <Tooltip
          content="University of Colorado | Department of Biomedical Informatics"
          button={false}
        >
          <a href="https://medschool.cuanschutz.edu/dbmi">
            <img
              src={colorado}
              alt="University of Colorado logo"
              style={{ maxHeight: "40px" }}
            />
          </a>
        </Tooltip>
        <Tooltip
          content="University of Minnesota | Department of Genetics, Cell Biology, and Development"
          button={false}
        >
          <a href="https://cbs.umn.edu/gcd">
            <img
              src={minnesota}
              alt="University of Minnesota logo"
              style={{ maxHeight: "15px" }}
            />
          </a>
        </Tooltip>
      </div>
    </footer>
  );
}

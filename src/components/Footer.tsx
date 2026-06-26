import chicago from "../assets/chicago.png";
import colorado from "../assets/colorado.png";
import minnesota from "../assets/minnesota.png";

export default function Footer() {
  return (
    <footer
      className="
      flex flex-row justify-between gap-8 bg-linear-to-r from-fuchsia-950
      to-indigo-950 p-8
      max-md:flex-col max-md:items-center
    "
    >
      <p>
        A project of the{" "}
        <a href="http://blekhmanlab.org/" target="_blank">
          Blekhman Lab
        </a>
        ,{" "}
        <a href="http://greenelab.com/" target="_blank">
          Greene Lab
        </a>
        ,{" "}
        <a href="https://seandavi.github.io/" target="_blank">
          Davis Lab
        </a>
        , and{" "}
        <a href="https://albert-lab.org/" target="_blank">
          Albert Lab
        </a>
        , in affiliation with...
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <a
          href="https://medicine.uchicago.edu/sections/genetic-medicine/"
          target="_blank"
          data-tooltip="University of Chicago | Section of Genetic Medicine"
        >
          <img
            src={chicago}
            alt="University of Chicago logo"
            style={{ maxHeight: "25px" }}
          />
        </a>
        <a
          href="https://medschool.cuanschutz.edu/dbmi"
          target="_blank"
          data-tooltip="University of Colorado | Department of Biomedical Informatics"
        >
          <img
            src={colorado}
            alt="University of Colorado logo"
            style={{ maxHeight: "40px" }}
          />
        </a>
        <a
          href="https://cbs.umn.edu/gcd"
          target="_blank"
          data-tooltip="University of Minnesota | Department of Genetics, Cell Biology, and
        Development"
        >
          <img
            src={minnesota}
            alt="University of Minnesota logo"
            style={{ maxHeight: "15px" }}
          />
        </a>
      </div>
    </footer>
  );
}

import classes from "./Footer.module.css";

const Footer = () => (
  <footer className={classes.footer}>
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
      <a href="https://seandavi.github.io/" target="_blacnk">
        Davis Lab
      </a>
      , and{" "}
      <a href="https://albert-lab.org/" target="_blank">
        Albert Lab
      </a>
      , in affiliation with...
    </p>

    <div className={classes.logos}>
      <a
        href="https://medicine.uchicago.edu/sections/genetic-medicine/"
        target="_blank"
        data-tooltip="University of Chicago | Section of Genetic Medicine"
      >
        <img
          src="chicago.png"
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
          src="colorado.png"
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
          src="minnesota.png"
          alt="University of Minnesota logo"
          style={{ maxHeight: "15px" }}
        />
      </a>
    </div>
  </footer>
);

export default Footer;

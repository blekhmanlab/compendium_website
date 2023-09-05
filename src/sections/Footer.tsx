import classes from "./Footer.module.css";

const Footer = () => (
  <footer>
    <div className="sub-section">
      <p>
        Source code: &nbsp;
        <a href="link" target="_blank">
          Database
        </a>{" "}
        &nbsp;
        <a href="link" target="_blank">
          R Package
        </a>{" "}
        &nbsp;
        <a href="link" target="_blank">
          Scripts
        </a>
      </p>

      <p>
        A project of the{" "}
        <a href="http://blekhmanlab.org/" target="_blank">
          Blekhman Lab
        </a>{" "}
        and{" "}
        <a href="http://greenelab.com/" target="_blank">
          Greene Lab
        </a>
        , in affiliation with...
      </p>
    </div>

    <div className={classes.cols}>
      <a
        href="https://medicine.uchicago.edu/sections/genetic-medicine/"
        target="_blank"
        data-tooltip="University of Chicago | Section of Genetic Medicine"
        className={classes.logo}
      >
        <img src="chicago.png" alt="University of Chicago logo" />
      </a>
      <a
        href="https://medschool.cuanschutz.edu/dbmi"
        target="_blank"
        data-tooltip="University of Colorado | Department of Biomedical Informatics"
        className={classes.logo}
      >
        <img src="colorado.png" alt="University of Colorado logo" />
      </a>
      <a
        href="https://cbs.umn.edu/gcd"
        target="_blank"
        data-tooltip="University of Minnesota | Department of Genetics, Cell Biology, and
        Development"
        className={classes.logo}
      >
        <img src="minnesota.png" alt="University of Minnesota logo" />
      </a>
    </div>
  </footer>
);

export default Footer;

import classes from "./Footer.module.css";

const Footer = () => (
  <footer>
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

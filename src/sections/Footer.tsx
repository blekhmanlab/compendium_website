import classes from "./Footer.module.css";

const Footer = () => (
  <footer>
    <div className={classes.footer}>
      <div>
        <h3>Affiliations</h3>

        <a
          href="https://medicine.uchicago.edu/sections/genetic-medicine/"
          target="_blank"
        >
          Univ. of Chicago | Section of Genetic Medicine
        </a>
        <br />
        <a href="https://medschool.cuanschutz.edu/dbmi" target="_blank">
          Univ. of Colorado | Dept. of Biomedical Informatics
        </a>
        <br />
        <a href="https://cbs.umn.edu/gcd" target="_blank">
          Univ. of Minnesota | Dept. of GCD
        </a>
      </div>

      <div>
        <h3>Collaborators</h3>

        <a href="http://blekhmanlab.org/" target="_blank">
          Blekhman Lab
        </a>
        <br />
        <a href="http://greenelab.com/" target="_blank">
          Greene Lab
        </a>
      </div>

      <div>
        <h3>Source Code</h3>

        <a href="link" target="_blank">
          Database
        </a>
        <br />
        <a href="link" target="_blank">
          R Package
        </a>
        <br />
        <a href="link" target="_blank">
          Scripts
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;

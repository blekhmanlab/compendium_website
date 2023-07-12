import { gsap } from "gsap";
import PoissonDiskSampling from "poisson-disk-sampling";
import { waitFor } from "@/util/async";
import { getCssVariable, getMatrix } from "@/util/dom";
import { cos, normalize, Point, scale, sin } from "@/util/math";
import classes from "./HeaderBg.module.css";

const HeaderBg = () => <canvas className={classes.canvas}></canvas>;

export default HeaderBg;

/** run once on app load */
(async () => {
  /** wait for necessary elements to load */
  const canvas = await waitFor(() => document.querySelector("canvas"));
  const svg = await waitFor(() =>
    document.querySelector<SVGSVGElement>("#logo")
  );
  const ctx = await waitFor(() => canvas.getContext("2d"));

  /** get all paths in svg to check */
  const paths = Array.from(svg.querySelectorAll("path")).map((path) => ({
    path,
    fill: window.getComputedStyle(path).fill !== "none",
    stroke: window.getComputedStyle(path).stroke !== "none",
    transform: getMatrix(svg, path),
  }));

  /** get css variable colors */
  const primary = getCssVariable("--primary");
  const secondary = getCssVariable("--secondary");
  const gray = getCssVariable("--gray");

  /** size and center canvas */
  const resize = () => {
    /** "oversampling" of canvas */
    const overscale = Math.min(window.devicePixelRatio * 1, 3);

    /** set canvas coordinate dimensions from canvas css dimensions */
    canvas.width = canvas.clientWidth * overscale;
    canvas.height = canvas.clientHeight * overscale;

    /** center camera at origin */
    ctx.translate(canvas.width / 2, canvas.height / 2);
  };
  resize();
  window.addEventListener("resize", resize);

  /** smaller of canvas half width/height */
  const canvasSize = Math.min(canvas.width, canvas.height) / 2;

  /** get bounding box of svg */
  const [svgLeft, svgTop, svgWidth, svgHeight] = (
    svg.getAttribute("viewBox") || ""
  )
    .split(" ")
    .map(Number);

  /** larger of svg half width/height */
  const svgSide = Math.max(svgWidth, svgHeight) / 2;

  /** desired spacing of points, in svg coordinates */
  const spacing = svgSide / 30;

  /** create evenly spaced points in range of 0 -> width/height */
  const points: Point[] = new PoissonDiskSampling({
    shape: [svgWidth, svgHeight],
    minDistance: spacing,
    maxDistance: spacing * 1.01,
    tries: 10,
  })
    .fill()
    /** shift range into range of svg viewbox */
    .map(([x, y]) => ({ x: x + svgLeft, y: y + svgTop }))
    /** remove points that aren't inside one of svg's paths */
    .filter(({ x, y }) =>
      paths.some(({ path, fill, stroke, transform }) => {
        let point = svg.createSVGPoint();
        point.x = x;
        point.y = y;
        /** account for transform svg/css properties */
        point = point.matrixTransform(transform.inverse());
        /** check if inside */
        return (
          (fill && path.isPointInFill(point)) ||
          (stroke && path.isPointInStroke(point))
        );
      })
    )
    /** map svg viewbox range to -0.5 -> 0.5 */
    .map(({ x, y }) => ({
      x: (x + svgWidth / 2 + svgLeft) / svgSide,
      y: (y + svgHeight / 2 + svgTop) / svgSide,
    }))
    /** scale to fit canvas */
    .map(({ x, y }) => ({
      x: canvasSize * x,
      y: canvasSize * y,
    }));

  /** hard limit number of points */
  while (points.length > 500)
    points.splice(Math.floor(Math.random() * points.length), 1);

  type Particle = {
    position: Point;
    destination: Point;
    alpha: number;
    color: string;
    spin: number;
    animations: gsap.core.Timeline[];
  };

  /** create particle for each point */
  const particles: Particle[] = points.map((point) => ({
    /** starting values */
    position: scale(normalize(point), canvasSize * 1.5),
    destination: point,
    color: gray,
    alpha: 0,
    spin: Math.random() * 360,
    animations: [],
  }));

  /** animate each particle */
  for (const particle of particles) {
    const duration = 2;
    const delay = Math.random() * duration;
    const ease = "power4.out";
    particle.animations = [
      gsap.timeline().to(particle.position, {
        x: particle.destination.x,
        y: particle.destination.y,
        duration,
        delay,
        ease,
      }),
      gsap
        .timeline()
        .to(particle, { alpha: 1, duration: 0.25, delay, ease })
        .to(particle, { alpha: 0.5, duration, ease }),
    ];
    gsap
      .timeline({ repeat: -1, yoyo: true, delay: -delay * 4 })
      .to(particle, { color: gray, duration, ease })
      .to(particle, { color: secondary, duration, ease })
      .to(particle, { color: primary, duration, ease });
  }

  /** size of particle in canvas coordinates */
  const size = canvasSize / 150;

  /** draw frame */
  const frame = () => {
    /** time in degrees, one full rotation per second */
    const t = 360 * (window.performance.now() / 1000);

    /** clear canvas */
    ctx.clearRect(
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    );

    /** draw particles */
    for (const { position, color, alpha, spin } of particles) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(
        position.x + sin(t / 3 + spin) * size,
        position.y + cos(t / 3 + spin) * size,
        size,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    /** call frame again */
    window.setTimeout(() => window.requestAnimationFrame(frame), 1);
  };
  frame();

  /** restart animations on click */
  canvas.addEventListener("click", () =>
    particles.forEach((particle) =>
      particle.animations.forEach((animation) => animation.restart())
    )
  );
})();

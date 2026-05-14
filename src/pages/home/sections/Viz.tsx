import type { Point } from "@/util/math";
import { useCallback, useEffect, useRef, useState } from "react";
import { useElementSize, useEventListener } from "@reactuses/core";
import { gsap } from "gsap";
import { random } from "lodash";
import PoissonDiskSampling from "poisson-disk-sampling";
import { sleep, waitFor } from "@/util/async";
import { getCssVariable, getMatrix } from "@/util/dom";
import { cos, dist, sin } from "@/util/math";

/** particle size */
const size = 1 / 140;
/** desired spacing of points */
const spacing = 1 / 30;

const Viz = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);

  /** init canvas context */
  useEffect(() => {
    if (canvas.current) ctx.current = canvas.current.getContext("2d");
  }, []);

  /** canvas size */
  const [width, height] = useElementSize(canvas);

  /** on resize */
  useEffect(() => {
    if (!canvas.current || !ctx.current) return;
    /** set canvas coordinate dimensions from canvas css dimensions */
    canvas.current.width = width * oversample;
    canvas.current.height = height * oversample;
    /** center camera at origin */
    ctx.current?.translate(canvas.current.width / 2, canvas.current.height / 2);
    /** smaller side */
    const side = Math.min(canvas.current.width, canvas.current.height);
    /** scale to contain */
    ctx.current?.scale(side / 2, side / 2);
  }, [width, height]);

  const [particles, setParticles] = useState<Particle[]>([]);

  /** draw frame */
  const frame = useCallback(() => {
    if (!canvas.current || !ctx.current) return;

    /** time in degrees, one full rotation per second */
    const t = 360 * (window.performance.now() / 1000);

    /** clear canvas */
    ctx.current.clearRect(
      -canvas.current.width / 2,
      -canvas.current.height / 2,
      canvas.current.width,
      canvas.current.height,
    );

    /** draw particles */
    for (const {
      position,
      size,
      color,
      alpha,
      spinAngle,
      spinRadius,
    } of particles) {
      ctx.current.globalAlpha = alpha;
      ctx.current.fillStyle = color;
      ctx.current.beginPath();
      ctx.current.arc(
        position.x + sin(t / 3 + spinAngle) * spinRadius,
        position.y + cos(t / 3 + spinAngle) * spinRadius,
        size,
        0,
        Math.PI * 2,
      );
      ctx.current.fill();
    }
  }, [particles]);

  useEffect(() => {
    /** call frame every repaint */
    gsap.ticker.add(frame);
    /** set fps to 60 */
    gsap.ticker.fps(60);
    /** cleanup */
    return () => gsap.ticker.remove(frame);
  }, [frame]);

  /** use gsap context to efficiently clean up old animations */
  const gsapCtx = useRef<gsap.Context>(null);

  const generate = useCallback((delay = 1000) => {
    /** cleanup any existing animations */
    gsapCtx.current?.revert();
    /** create new animations */
    gsapCtx.current = gsap.context(async () => {
      /** wait a bit */
      await sleep(delay);
      /** get/set new particles */
      setParticles(await getParticles());
    });
  }, []);

  /** on page load */
  useEffect(() => {
    generate(1000);
    /** cleanup */
    return () => gsapCtx.current?.revert();
  }, [generate]);

  /** track mouse */
  useEventListener("mousemove", (event) => {
    if (!canvas.current || !ctx.current) return;
    const { left, top } = canvas.current.getBoundingClientRect();
    const point = new DOMPoint(event.clientX - left, event.clientY - top);
    point.x *= oversample;
    point.y *= oversample;
    const mouse = point.matrixTransform(ctx.current.getTransform().inverse());
    /** bulge particles */
    for (const particle of particles) {
      /** strength of effect, closer -> higher */
      const strength = 1000 ** -dist(particle.position, mouse);
      gsap.to(particle, { spinRadius: size + size * (20 * strength) });
    }
  });

  return (
    <canvas
      ref={canvas}
      className="absolute inset-0 -z-10 size-full"
      onClick={() => generate(0)}
    />
  );
};

/** "oversampling" of canvas */
const oversample = 2;

export default Viz;

type Particle = {
  position: Point;
  destination: Point;
  size: number;
  alpha: number;
  color: string;
  spinAngle: number;
  spinRadius: number;
};

/** generate particles */
const getParticles = async () => {
  /** wait for necessary elements to load */
  const svg = await waitFor(() =>
    document.querySelector<SVGSVGElement>("#logo"),
  );

  /** get all paths in svg to check */
  const paths = Array.from(svg.querySelectorAll("path")).map((path) => ({
    path,
    fill: window.getComputedStyle(path).fill !== "none",
    stroke: window.getComputedStyle(path).stroke !== "none",
    transform: getMatrix(svg, path),
  }));

  const primary = getCssVariable("--color-primary");
  const secondary = getCssVariable("--color-secondary");
  const gray = getCssVariable("--color-slate-500");

  /** get bounding box of svg */
  const [left = 0, top = 0, width = 100, height = 100] = (
    svg.getAttribute("viewBox") || ""
  )
    .split(" ")
    .map(Number);

  /** larger of svg half width/height */
  const side = Math.max(width, height) / 2;

  /** create evenly spaced points in range of 0 -> width/height */
  const points: Point[] = new PoissonDiskSampling({
    shape: [width, height],
    minDistance: side * spacing,
    maxDistance: side * spacing * 1.01,
    tries: 10,
  })
    .fill()
    /** shift range into range of svg viewbox */
    .map(([x = 0, y = 0]) => ({ x: x + left, y: y + top }))
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
      }),
    )
    /** map svg viewbox range to [-1, 1] */
    .map(({ x, y }) => ({
      x: ((x - left) / width) * 2 - 1,
      y: ((y - top) / height) * 2 - 1,
    }));

  /** hard limit number of points */
  while (points.length > 500) points.splice(random(points.length), 1);

  /** create particle for each point */
  const particles: Particle[] = points.map((point) => ({
    /** starting values */
    position: { x: point.x * 2, y: point.y * 2 },
    destination: point,
    size,
    color: gray,
    alpha: 0,
    spinAngle: random(360),
    spinRadius: size,
  }));

  /** animate each particle */
  for (const particle of particles) {
    const duration = 2;
    const delay = random(duration, true);
    const ease = "power4.out";
    /** animate position */
    gsap.to(particle.position, {
      ...particle.destination,
      duration,
      delay,
      ease,
    });
    /** animate alpha */
    gsap
      .timeline()
      .to(particle, { alpha: 1, duration: duration * 0.5, delay, ease })
      .to(particle, { alpha: 0.35, duration: duration * 0.5, ease });
    /** animate color */
    gsap
      .timeline({ repeat: -1, yoyo: true, delay: particle.destination.x })
      .to(particle, { color: gray, duration: duration * 0.5, ease })
      .to(particle, { color: primary, duration: duration * 0.5, ease })
      .to(particle, { color: secondary, duration: duration * 0.5, ease });
  }

  return particles;
};

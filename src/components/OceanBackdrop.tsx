import { useRef, useEffect } from "react";

const OCEAN_COLOR_TOP = "#4ec6e8";
const OCEAN_COLOR_BOTTOM = "#b3e0e6";
const RIPPLE_COLOR = "rgba(255,255,255,0.7)";
const RIPPLE_LIFETIME = 1000; // ms
const RIPPLE_MAX_RADIUS = 60;
const RIPPLE_MIN_RADIUS = 18;
const RIPPLE_LINE_WIDTH = 2.5;

// Surface ring constants (replacing bubbles)
const RING_COLOR = "rgba(255,255,255,0.7)";
const RING_MIN_RADIUS = 10;
const RING_MAX_RADIUS = 30;
const RING_SPAWN_RATE = 0.07; // Probability per frame
const RING_LIFETIME = 1800; // ms
const RING_LINE_WIDTH = 2.5;

interface Point {
  x: number;
  y: number;
}

interface Ripple {
  x: number;
  y: number;
  start: number;
  points: Point[];
}

interface SurfaceRing {
  x: number;
  y: number;
  start: number;
  initialRadius: number;
}

interface Size {
  width: number;
  height: number;
}

function randomWobble(
  radius: number,
  points: number = 32,
  wobble: number = 2
): Point[] {
  // Returns an array of [x, y] points for a wobbly circle
  const arr: Point[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius + (Math.random() - 0.5) * wobble;
    arr.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }
  return arr;
}

const drawSurfaceRing = (
  ctx: CanvasRenderingContext2D,
  ring: SurfaceRing,
  now: number
): boolean => {
  const elapsed = now - ring.start;
  if (elapsed > RING_LIFETIME) return false;
  const t = elapsed / RING_LIFETIME;
  const radius =
    ring.initialRadius + t * (RING_MAX_RADIUS - ring.initialRadius);
  const alpha = 1 - t;

  ctx.save();
  ctx.globalAlpha = alpha * 0.7;
  ctx.strokeStyle = RING_COLOR;
  ctx.lineWidth = RING_LINE_WIDTH;
  ctx.beginPath();
  ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  return true;
};

const Ocean = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripples = useRef<Ripple[]>([]);
  const rings = useRef<SurfaceRing[]>([]);
  const animationRef = useRef<number>();
  const ringAnimationRef = useRef<number>();
  const sizeRef = useRef<Size>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Resize canvas to fill window
  useEffect(() => {
    const handleResize = () => {
      sizeRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ripples.current.push({
        x,
        y,
        start: performance.now(),
        points: randomWobble(RIPPLE_MIN_RADIUS),
      });
    };
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("mousemove", handleMouseMove);
    return () => canvas.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Surface ring animation loop
  useEffect(() => {
    const spawnRing = (width: number, height: number) => {
      if (Math.random() < RING_SPAWN_RATE) {
        const initialRadius =
          RING_MIN_RADIUS +
          Math.random() * (RING_MAX_RADIUS - RING_MIN_RADIUS) * 0.3;
        rings.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          start: performance.now(),
          initialRadius,
        });
      }
    };

    const animateRings = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width, height } = sizeRef.current;
      spawnRing(width, height);
      rings.current = rings.current.filter((ring) =>
        drawSurfaceRing(ctx, ring, performance.now())
      );
      ringAnimationRef.current = requestAnimationFrame(animateRings);
    };
    ringAnimationRef.current = requestAnimationFrame(animateRings);
    return () => {
      if (ringAnimationRef.current)
        cancelAnimationFrame(ringAnimationRef.current);
    };
  }, []);

  // Main animation loop for ocean and ripples
  useEffect(() => {
    const drawOcean = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, OCEAN_COLOR_TOP);
      grad.addColorStop(1, OCEAN_COLOR_BOTTOM);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    };

    const drawRipple = (
      ctx: CanvasRenderingContext2D,
      ripple: Ripple,
      now: number
    ): boolean => {
      const elapsed = now - ripple.start;
      if (elapsed > RIPPLE_LIFETIME) return false;
      const t = elapsed / RIPPLE_LIFETIME;
      const radius =
        RIPPLE_MIN_RADIUS + t * (RIPPLE_MAX_RADIUS - RIPPLE_MIN_RADIUS);
      const alpha = 1 - t;
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = RIPPLE_COLOR;
      ctx.lineWidth = RIPPLE_LINE_WIDTH;
      ctx.beginPath();
      const points = ripple.points.map((point) => ({
        x: point.x * (radius / RIPPLE_MIN_RADIUS),
        y: point.y * (radius / RIPPLE_MIN_RADIUS),
      }));
      points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(ripple.x + point.x, ripple.y + point.y);
        else ctx.lineTo(ripple.x + point.x, ripple.y + point.y);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      return true;
    };

    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width, height } = sizeRef.current;
      ctx.clearRect(0, 0, width, height);
      drawOcean(ctx, width, height);
      const now = performance.now();
      // Update and draw ripples
      ripples.current = ripples.current.filter((ripple) =>
        drawRipple(ctx, ripple, now)
      );
      // Draw surface rings in the main loop as well
      rings.current.forEach((ring) => {
        drawSurfaceRing(ctx, ring, now);
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        display: "block",
      }}
      width={sizeRef.current.width}
      height={sizeRef.current.height}
    />
  );
};

export default Ocean;

import { useRef, useEffect } from "react";

const OCEAN_COLOR_TOP = "#4ec6e8";
const OCEAN_COLOR_BOTTOM = "#b3e0e6";
const RIPPLE_COLOR = "rgba(255,255,255,0.7)";
const RIPPLE_LIFETIME = 1000; // ms
const RIPPLE_MAX_RADIUS = 60;
const RIPPLE_MIN_RADIUS = 18;
const RIPPLE_LINE_WIDTH = 2.5;
const RIPPLE_SPAWN_THROTTLE = 2; // Only allow 1 ripple every 2 mousemoves

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
  movementAngle: number;
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
  const mouseMoveCount = useRef(0);
  const prevMouse = useRef<{ x: number; y: number } | null>(null);

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
      mouseMoveCount.current++;
      if (mouseMoveCount.current % RIPPLE_SPAWN_THROTTLE !== 0) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let movementAngle = 0;
      if (prevMouse.current) {
        const dx = x - prevMouse.current.x;
        const dy = y - prevMouse.current.y;
        movementAngle = Math.atan2(dy, dx);
      }
      prevMouse.current = { x, y };
      ripples.current.push({
        x,
        y,
        start: performance.now(),
        points: randomWobble(RIPPLE_MIN_RADIUS),
        movementAngle,
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
      ctx.strokeStyle = RIPPLE_COLOR;
      ctx.lineWidth = RIPPLE_LINE_WIDTH;
      const points = ripple.points.map((point) => ({
        x: point.x * (radius / RIPPLE_MIN_RADIUS),
        y: point.y * (radius / RIPPLE_MIN_RADIUS),
      }));
      const total = points.length;
      for (let i = 0; i < total; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % total];
        // Angle from center for this segment
        const angle = (i / total) * Math.PI * 2;
        // Angle difference from movement direction
        let diff = Math.abs(angle - ripple.movementAngle);
        diff = Math.min(diff, Math.abs(Math.PI * 2 - diff));
        // Fade: max at 0 and PI, min at PI/2 and 3PI/2
        const fade = 0.5 + 0.5 * Math.cos(diff); // 1 at 0/PI, 0 at PI/2/3PI/2
        ctx.globalAlpha = alpha * 0.7 * fade;
        ctx.beginPath();
        ctx.moveTo(ripple.x + p1.x, ripple.y + p1.y);
        ctx.lineTo(ripple.x + p2.x, ripple.y + p2.y);
        ctx.stroke();
      }
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

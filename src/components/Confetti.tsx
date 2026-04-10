import { useRef, useEffect, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  decay: number;
  shape: 'rect' | 'circle' | 'strip';
}

const COLORS = ['#c8a45a', '#ede8dd', '#e8d5a3', '#fff8e7', '#b8943a', '#d4b86a'];
const GRAVITY = 0.12;
const DURATION_MS = 4500;

function createBurst(cx: number, cy: number, count: number): Particle[] {
  const shapes: Particle['shape'][] = ['rect', 'circle', 'strip'];
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed * (0.6 + Math.random() * 0.8),
      vy: Math.sin(angle) * speed - 4 - Math.random() * 3,
      size: 3 + Math.random() * 7,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      alpha: 1,
      decay: 0.004 + Math.random() * 0.006,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    };
  });
}

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const prevActive = useRef(false);

  const fire = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Multiple bursts from different positions staggered in time
    const w = canvas.width;
    const h = canvas.height;
    const allParticles: Particle[] = [];

    // Initial burst from 3 locations
    allParticles.push(...createBurst(w * 0.15, h * 0.5, 60));
    allParticles.push(...createBurst(w * 0.85, h * 0.5, 60));
    allParticles.push(...createBurst(w * 0.5, h * 0.35, 50));

    // Delayed secondary bursts
    setTimeout(() => {
      allParticles.push(...createBurst(w * 0.3, h * 0.6, 40));
      allParticles.push(...createBurst(w * 0.7, h * 0.4, 40));
    }, 300);

    setTimeout(() => {
      allParticles.push(...createBurst(w * 0.5, h * 0.55, 50));
    }, 600);

    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      if (elapsed > DURATION_MS) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = 0;
      for (const p of allParticles) {
        if (p.alpha <= 0) continue;
        alive++;

        p.vy += GRAVITY;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.alpha = Math.max(0, p.alpha - p.decay);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'strip') {
          ctx.fillRect(-p.size / 6, -p.size, p.size / 3, p.size * 2);
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }

        ctx.restore();
      }

      if (alive > 0 && elapsed < DURATION_MS) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // Fire on rising edge only; never cancel mid-animation
  useEffect(() => {
    if (active && !prevActive.current) {
      fire();
    }
    prevActive.current = active;
  }, [active, fire]);

  // Cancel only on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 30,
      }}
    />
  );
}

export default Confetti;

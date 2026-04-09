import React, { useRef, useEffect } from 'react';

export function ConfettiCannon({ active }) {
  const cvs = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    if (!active) return;
    const c = cvs.current; if (!c) return;
    c.width = window.innerWidth; c.height = window.innerHeight;
    const ctx = c.getContext("2d");
    const cols = ["#c8a45a", "#ede8dd", "#ffffff", "#d4af7a", "#8b7355", "#f5e6c8", "#a08040", "#e8d0a0"];
    const pts = Array.from({ length: 260 }, (_, i) => {
      const left = i < 130;
      const ang = (left ? 25 + Math.random() * 65 : 115 + Math.random() * 40) * Math.PI / 180;
      const spd = 9 + Math.random() * 17;
      return {
        x: left ? 0 : c.width, y: c.height,
        vx: Math.cos(ang) * spd, vy: -Math.abs(Math.sin(ang)) * spd,
        w: 5 + Math.random() * 10, h: 3 + Math.random() * 5,
        color: cols[Math.floor(Math.random() * cols.length)],
        rot: Math.random() * 360, rspd: (Math.random() - .5) * 12,
        grav: 0.22 + Math.random() * 0.22, dead: false
      };
    });

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      let alive = false;
      pts.forEach(p => {
        if (p.dead) return;
        p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.rot += p.rspd;
        const op = Math.max(0, 1 - frame / 175);
        if (op <= 0 || p.y > c.height + 30) { p.dead = true; return; }
        alive = true;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.globalAlpha = op; ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      frame++;
      if (alive) raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [active]);

  if (!active) return null;
  return <canvas ref={cvs} className="fixed inset-0 pointer-events-none z-[300]" />;
}

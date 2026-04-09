import React, { useState, useEffect } from 'react';

const STEAM_PTS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left:  `${(i * 4.3) % 94}%`,
  size:  52 + (i * 19) % 110,
  delay: (i * 0.048) % 0.5,
  dur:   0.6 + (i * 0.075) % 0.58,
}));

export function SteamOverlay({ active }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (active) { setVis(true); }
    else { const t = setTimeout(() => setVis(false), 750); return () => clearTimeout(t); }
  }, [active]);

  if (!vis) return null;

  return (
    <div className={`fixed inset-0 z-[9500] overflow-hidden ${active ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div className="absolute inset-0 bg-[#f0ead8]/15 backdrop-blur-3xl animate-[steamFade_1.15s_ease_forwards]" />
      {STEAM_PTS.map(p => (
        <div 
          key={p.id} 
          className="absolute -bottom-24 rounded-full opacity-0"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size * 1.45}px`,
            background: "radial-gradient(ellipse at 35% 35%, rgba(255,255,255,0.9), rgba(255,255,255,0))",
            filter: "blur(18px)",
            animation: `steamRise ${p.dur}s ${p.delay}s ease-out forwards`,
          }}
        />
      ))}
    </div>
  );
}

import React from "react";

const WISPS = [
  { left: "5%",  size: 120, duration: 18, delay: 0 },
  { left: "15%", size: 80,  duration: 22, delay: 3 },
  { left: "30%", size: 160, duration: 26, delay: 7 },
  { left: "45%", size: 60,  duration: 15, delay: 2 },
  { left: "58%", size: 200, duration: 30, delay: 10 },
  { left: "72%", size: 90,  duration: 20, delay: 5 },
  { left: "85%", size: 140, duration: 24, delay: 12 },
] as const;

export function SteamOverlay() {
  return (
    <>
      <style>{`
        @keyframes steamDrift {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(-110vh) scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 5,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {WISPS.map((wisp, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: `-${wisp.size}px`,
              left: wisp.left,
              width: `${wisp.size}px`,
              height: `${wisp.size * 1.5}px`,
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse at center, rgba(200,164,90,0.04), transparent 70%)",
              filter: `blur(${wisp.size * 0.3}px)`,
              animation: `steamDrift ${wisp.duration}s ${wisp.delay}s ease-in-out infinite`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>
    </>
  );
}

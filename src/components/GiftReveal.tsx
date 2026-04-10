import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Confetti } from './Confetti';

interface GiftRevealProps {
  totalPuzzles: number;
  solvedCount: number;
}

/* ── Phase timeline ──
   0s      Fireworks burst #1
   0.8s    Fireworks burst #2
   1.5s    Present emoji scales in
   3s      Present fades, text begins
   3.5-7s  Dramatic reveal lines
   7.5s    Gift card slides up
   8s+     Constant gentle confetti
*/

const REVEAL_LINES = [
  { text: 'Dave.', delay: 3500, className: 'text-[42px] sm:text-[48px] font-serif' },
  { text: 'You actually did it.', delay: 4500, className: 'text-[22px] sm:text-[24px] font-serif italic text-dg-muted' },
  { text: 'All 25 puzzles. Honestly, we had our doubts.', delay: 5800, className: 'text-sm sm:text-base font-mono text-dg-muted' },
  { text: 'But here we are.', delay: 7000, className: 'text-base sm:text-lg font-mono text-dg-muted' },
];

/** Gentle falling confetti particles */
function FallingConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const COLORS = ['#c8a45a', '#ede8dd', '#e8d5a3', '#fff8e7', '#b8943a', '#d4b86a'];

  interface FallingParticle {
    x: number;
    y: number;
    vy: number;
    vx: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    alpha: number;
    shape: 'rect' | 'circle' | 'strip';
    wobbleOffset: number;
    wobbleSpeed: number;
  }

  const spawn = useCallback((w: number): FallingParticle => {
    const shapes: FallingParticle['shape'][] = ['rect', 'circle', 'strip'];
    return {
      x: Math.random() * w,
      y: -10 - Math.random() * 60,
      vy: 0.6 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.3,
      size: 3 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.08,
      alpha: 0.4 + Math.random() * 0.5,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.02,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: FallingParticle[] = [];
    // Pre-populate
    for (let i = 0; i < 40; i++) {
      const p = spawn(canvas.width);
      p.y = Math.random() * canvas.height;
      particles.push(p);
    }

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // Spawn new particles periodically
      if (frame % 8 === 0 && particles.length < 80) {
        particles.push(spawn(canvas.width));
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y += p.vy;
        p.x += p.vx + Math.sin(frame * p.wobbleSpeed + p.wobbleOffset) * 0.3;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height + 20) {
          particles.splice(i, 1);
          continue;
        }

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

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [spawn]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 25,
      }}
    />
  );
}

export function GiftReveal({ totalPuzzles, solvedCount }: GiftRevealProps) {
  const [phase, setPhase] = useState(0);
  const [showPresent, setShowPresent] = useState(false);
  const [presentGone, setPresentGone] = useState(false);
  const [showGift, setShowGift] = useState(false);
  const [showFallingConfetti, setShowFallingConfetti] = useState(false);
  const [confettiBurst1, setConfettiBurst1] = useState(false);
  const [confettiBurst2, setConfettiBurst2] = useState(false);
  const [confettiBurst3, setConfettiBurst3] = useState(false);

  useEffect(() => {
    const timers: number[] = [];

    // Fireworks bursts
    timers.push(window.setTimeout(() => { setConfettiBurst1(true); setTimeout(() => setConfettiBurst1(false), 100); }, 200));
    timers.push(window.setTimeout(() => { setConfettiBurst2(true); setTimeout(() => setConfettiBurst2(false), 100); }, 900));
    timers.push(window.setTimeout(() => { setConfettiBurst3(true); setTimeout(() => setConfettiBurst3(false), 100); }, 1600));

    // Present emoji appears
    timers.push(window.setTimeout(() => setShowPresent(true), 1800));

    // Present fades out, text begins
    timers.push(window.setTimeout(() => setPresentGone(true), 3200));

    // Text reveal phases
    REVEAL_LINES.forEach((line, i) => {
      timers.push(window.setTimeout(() => setPhase(i + 1), line.delay));
    });

    // Gift card appears
    timers.push(window.setTimeout(() => setShowGift(true), 8000));

    // Constant falling confetti starts
    timers.push(window.setTimeout(() => setShowFallingConfetti(true), 8500));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      <Confetti active={confettiBurst1} />
      <Confetti active={confettiBurst2} />
      <Confetti active={confettiBurst3} />
      {showFallingConfetti && <FallingConfetti />}

      <div className="space-y-8 text-center">
        {/* Present emoji animation */}
        <AnimatePresence>
          {showPresent && !presentGone && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, y: -40 }}
              transition={{ type: 'spring', damping: 12, stiffness: 150 }}
              className="flex justify-center py-6"
            >
              <motion.span
                className="text-[80px] sm:text-[100px] inline-block"
                animate={{
                  scale: [1, 1.08, 1],
                  rotate: [0, -3, 3, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {'\u{1F381}'}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dramatic text reveal */}
        {phase > 0 && (
          <section className="glass-panel border border-dg-border p-8 sm:p-10 space-y-5 min-h-[200px] flex flex-col items-center justify-center">
            <AnimatePresence>
              {REVEAL_LINES.slice(0, phase).map((line) => (
                <motion.div
                  key={line.text}
                  initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={line.className}
                >
                  {line.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </section>
        )}

        {/* Gift voucher card */}
        {showGift && (
          <motion.section
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel border border-dg-accent/40 overflow-hidden max-w-xl mx-auto"
            style={{ boxShadow: '0 0 80px rgba(200,164,90,0.18), 0 0 30px rgba(200,164,90,0.08)' }}
          >
            {/* Top accent strip */}
            <div className="h-1 bg-gradient-to-r from-transparent via-dg-accent to-transparent" />

            <div className="p-8 sm:p-10 space-y-6">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[11px] uppercase tracking-[0.5em] text-dg-accent"
              >
                Your gift has been unlocked
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="space-y-1"
              >
                <h2 className="text-[40px] sm:text-[48px] font-serif font-light leading-tight text-dg-accent">
                  Sense of Self
                </h2>
                <p className="text-[13px] font-mono text-dg-muted">
                  Collingwood, Melbourne
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="border border-dg-accent/20 rounded-xl p-5 bg-dg-accent/5 space-y-4"
              >
                <p className="text-[16px] sm:text-[18px] leading-relaxed text-dg-fg/85 italic font-serif">
                  &ldquo;For David, on your transformative journey to &lsquo;New Dave, who dis?&rsquo; And beyond...&rdquo;
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-dg-muted mb-0.5">Value</p>
                    <p className="text-[22px] font-mono text-dg-accent font-light">$350</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-dg-muted mb-0.5">Expires</p>
                    <p className="text-[14px] font-mono text-dg-fg/80">5 April 2029</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-dg-accent/15">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-dg-muted mb-1">Voucher Code</p>
                  <p className="text-[15px] font-mono text-dg-accent tracking-[0.15em] select-all">
                    UJOBLHPQOBPJA
                  </p>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="text-[13px] text-dg-muted/80 leading-relaxed"
              >
                A bespoke bathing experience &mdash; steam, salt, warmth, and glow.
                <br />
                Redeemable across all Sense of Self services and retail.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7 }}
                className="text-[13px] text-dg-muted/60 italic font-mono"
              >
                You earned it. Somehow.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.0 }}
                className="flex flex-wrap justify-center gap-3 pt-4"
              >
                <a
                  href="https://senseofself.com.au"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-dg-accent bg-dg-accent/15 px-6 py-3 uppercase tracking-[0.4em] text-[11px] font-mono text-dg-accent hover:bg-dg-accent/25 transition-colors"
                >
                  Visit Sense of Self
                </a>
              </motion.div>

              <p className="text-[11px] uppercase tracking-[0.3em] text-dg-muted pt-2">
                {solvedCount} / {totalPuzzles} puzzles solved
              </p>
            </div>
          </motion.section>
        )}
      </div>
    </>
  );
}

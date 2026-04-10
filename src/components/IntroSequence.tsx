import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const LINES = [
  { text: 'Perspective & Puzzle', size: 14, uppercase: true },
  { text: 'A slow reveal for Sense of Self', size: 36 },
  { text: 'Playful, cryptic, intentional.', size: 24 },
];

interface IntroSequenceProps {
  onComplete: () => void;
}

export function IntroSequence({ onComplete }: IntroSequenceProps) {
  const [phase, setPhase] = useState(0);
  const done = phase >= LINES.length;

  useEffect(() => {
    if (phase < LINES.length) {
      const timer = window.setTimeout(() => setPhase((prev) => prev + 1), 900);
      return () => window.clearTimeout(timer);
    }
    const finish = window.setTimeout(onComplete, 800);
    return () => window.clearTimeout(finish);
  }, [phase, onComplete]);

  const animations = useMemo(
    () =>
      LINES.map((_, index) => ({
        delay: index * 0.2,
      })),
    []
  );

  return (
    <div className="space-y-6 text-center w-full mt-6">
      {LINES.map((line, index) => (
        <motion.div
          key={line.text}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: phase > index ? 1 : 0, y: phase > index ? 0 : 18 }}
          transition={{ duration: 0.8, delay: animations[index].delay }}
          className={`font-serif font-light ${line.uppercase ? 'uppercase tracking-[0.45em]' : ''}`}
          style={{ fontSize: `${line.size}px` }}
        >
          {line.text}
        </motion.div>
      ))}
      <motion.span
        className="text-[12px] tracking-[0.4em] uppercase text-dg-accent inline-flex items-center justify-center"
        animate={{ opacity: done ? 1 : 0.25 }}
        transition={{ duration: 0.6 }}
      >
        {done ? 'Ready to begin' : 'Setting the stage'}
      </motion.span>
    </div>
  );
}

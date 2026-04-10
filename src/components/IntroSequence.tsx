import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const LINES = [
  { text: 'Oi, Dave.', delay: 0, accent: false, bold: true },
  { text: 'Yeah, you.', delay: 1000, accent: false, bold: false },
  { text: 'We both know you\'re not the sharpest tool in the shed...', delay: 2400, accent: false, bold: false },
  { text: 'But you ARE the most loveable.', delay: 4200, accent: true, bold: true },
  { text: 'So here\'s 25 puzzles.', delay: 5800, accent: false, bold: false },
  { text: 'Solve them all and unlock something special.', delay: 7000, accent: false, bold: false },
  { text: 'No pressure. Just vibes. And a timer. And penalties.', delay: 8400, accent: false, bold: false },
  { text: 'Good luck, legend.', delay: 9800, accent: true, bold: true },
];

const TOTAL_MS = LINES[LINES.length - 1].delay + 1500; // ~11300ms
export const INTRO_DURATION_MS = TOTAL_MS;

interface IntroSequenceProps {
  onComplete: () => void;
}

export function IntroSequence({ onComplete }: IntroSequenceProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(TOTAL_MS / 1000));
  const [done, setDone] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    const timers: number[] = [];
    LINES.forEach((line, i) => {
      timers.push(window.setTimeout(() => setVisibleLines(i + 1), line.delay));
    });
    timers.push(window.setTimeout(() => {
      setDone(true);
      setSecondsLeft(0);
      onComplete();
    }, TOTAL_MS));

    const tick = window.setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, Math.ceil((TOTAL_MS - elapsed) / 1000));
      setSecondsLeft(remaining);
    }, 300);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3 text-center w-full py-2 min-h-[240px] flex flex-col items-center justify-center">
      <AnimatePresence>
        {LINES.slice(0, visibleLines).map((line) => (
          <motion.p
            key={line.text}
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`text-base leading-relaxed ${
              line.accent ? 'text-dg-accent' : 'text-dg-fg/70'
            } ${line.bold ? 'font-serif text-lg' : 'font-mono text-sm'}`}
          >
            {line.text}
          </motion.p>
        ))}
      </AnimatePresence>
{/* Countdown moved to parent button */}
    </div>
  );
}

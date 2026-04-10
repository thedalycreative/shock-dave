import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CooldownInterstitialProps {
  puzzleId: string;
  remaining: number;
  totalPuzzles: number;
  solvedCount: number;
}

/** Each set is a sequence of roast lines shown between puzzles */
const ROAST_SETS = [
  [
    'Hold up.',
    'Did Dave just... get one right?',
    'Someone check the simulation. Something\'s broken.',
    'Alright, alright. Credit where it\'s due.',
    'Now sit tight. Don\'t touch anything.',
  ],
  [
    'Another one bites the dust.',
    'Your IQ just went up by 0.3 points. Congrats.',
    'Even monkeys eventually type Shakespeare, Dave.',
    'The next one won\'t be so easy.',
    'Actually, who are we kidding.',
  ],
  [
    'Dave\'s rolling now!',
    'Plot twist: we made the first few easy on purpose.',
    'Don\'t get cocky.',
    'Remember the time you Googled "how to boil water"?',
    'Deep breaths. Your brain\'s not used to this much activity.',
  ],
  [
    'Unbelievable.',
    'Dave. Did. It. Again.',
    'We\'re genuinely running out of roast material.',
    'You\'re like a fine wine — getting slightly less terrible with age.',
    'Keep going, legend. Or whatever you are.',
  ],
  [
    'Okay wait.',
    'Is someone feeding you answers?',
    'Check Dave\'s pockets. Check his browser tabs.',
    'Fine. We\'ll allow it.',
    'For now.',
  ],
  [
    'Correct.',
    'We had to double-check. Three times.',
    'Dave, mate — you\'re actually doing this.',
    'Your parents would be mildly impressed.',
    'Mildly.',
  ],
  [
    'Right again!',
    'At this rate you might actually unlock the gift.',
    'Plot twist: the real gift was the brain cells you lost along the way.',
    'Actually no, there\'s a real gift. Keep going.',
    'Timer\'s ticking, big fella.',
  ],
  [
    'Boom.',
    'Dave\'s on fire.',
    'Not literally. Although with your cooking skills, anything\'s possible.',
    'The finish line is getting closer.',
    'Try not to trip over it.',
  ],
];

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function CooldownInterstitial({ puzzleId, remaining, totalPuzzles, solvedCount }: CooldownInterstitialProps) {
  const setIndex = (parseInt(puzzleId, 10) - 1) % ROAST_SETS.length;
  const lines = ROAST_SETS[setIndex];
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const timers: number[] = [];
    lines.forEach((_line, i) => {
      timers.push(window.setTimeout(() => setVisibleCount(i + 1), 800 + i * 1400));
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleId]);

  const puzzlesLeft = totalPuzzles - solvedCount;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel border border-dg-border rounded-2xl p-6 sm:p-8 space-y-5"
    >
      {/* Timer badge */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.3em] font-mono text-dg-accent/70">
          Next puzzle in
        </span>
        <span className="text-sm font-mono text-dg-accent">
          {formatTimer(remaining)}
        </span>
      </div>

      {/* Roast lines */}
      <div className="min-h-[180px] flex flex-col items-center justify-center space-y-3 py-2">
        <AnimatePresence>
          {lines.slice(0, visibleCount).map((line, i) => (
            <motion.p
              key={`${puzzleId}-${i}`}
              initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`text-center leading-relaxed ${
                i === 0
                  ? 'text-lg font-serif text-dg-fg'
                  : i === lines.length - 1
                  ? 'text-sm font-mono text-dg-accent italic'
                  : 'text-sm font-mono text-dg-fg/70'
              }`}
            >
              {line}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>

      {/* Progress note */}
      <div className="text-center">
        <p className="text-[10px] font-mono text-dg-muted uppercase tracking-widest">
          {solvedCount} down &middot; {puzzlesLeft} to go
        </p>
      </div>
    </motion.section>
  );
}

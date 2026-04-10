import { motion } from 'framer-motion';
import { useMemo } from 'react';

const ROASTS_BY_STATE = {
  correct: [
    'Wait... Dave actually got one right?',
    'Even a broken clock, Dave. Even a broken clock.',
    'The bar was underground and you still tripped over it. But you cleared it!',
    'Your one brain cell just high-fived itself.',
    'Don\'t let this go to your head. It\'s already big enough.',
    'Somewhere, a teacher is crying tears of joy.',
    'Dave 1, Puzzles 0. Don\'t get cocky.',
    'That was... surprisingly not terrible.',
    'Screenshot this. Nobody will believe you.',
  ],
  wrong: [
    'Classic Dave.',
    'Have you considered reading the question?',
    'The answer was right there, mate. RIGHT there.',
    'Your Wi-Fi signal has more bars than your IQ right now.',
    'Dave. Mate. Come on.',
    'Even the hint is embarrassed for you.',
    'Google called. They want their search history back.',
    'This is why we can\'t have nice things, Dave.',
    'Your confidence is inspiring, if misplaced.',
  ],
  waiting: [
    'Take your time, Dave. The puzzles aren\'t going anywhere. Unlike your hairline.',
    'Still thinking? That\'s a new personal best.',
    'The timer\'s ticking but honestly, no rush. You need all the time you can get.',
    'Fun fact: this cooldown exists because we assumed you\'d need a breather.',
    'Dave\'s brain: buffering...',
    'Use this time wisely. Maybe stretch. Both physically and intellectually.',
  ],
  hint: [
    'Needed help already? Shocker.',
    'No shame in hints, Dave. Well, a little shame.',
    'The hint fairy has arrived. She\'s judging you.',
    'Here\'s your hint. Try not to waste this one too.',
  ],
};

interface DaveRoastProps {
  state: 'correct' | 'wrong' | 'waiting' | 'hint';
  puzzleId?: string;
}

export function DaveRoast({ state, puzzleId }: DaveRoastProps) {
  const roast = useMemo(() => {
    const pool = ROASTS_BY_STATE[state];
    const seed = puzzleId ? parseInt(puzzleId, 10) : Math.floor(Math.random() * pool.length);
    return pool[seed % pool.length];
  }, [state, puzzleId]);

  return (
    <motion.p
      key={`${state}-${puzzleId}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="text-xs text-dg-muted/70 italic font-mono text-center py-1"
    >
      &ldquo;{roast}&rdquo;
    </motion.p>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Confetti } from './Confetti';

interface CooldownInterstitialProps {
  puzzleId: string;
  remaining: number;
  totalPuzzles: number;
  solvedCount: number;
}

/**
 * Massive roast library — each line pool is picked randomly per session
 * so Dave never sees the same sequence twice in a row.
 */
const OPENERS = [
  'Hold up.',
  'Wait.',
  'Okay, stop.',
  'Excuse me.',
  'Oi.',
  'Right then.',
  'Unbelievable.',
  'Well well well.',
  'Shut the front door.',
  'No way.',
  'Dave.',
  'Ladies and gentlemen.',
  'Breaking news.',
  'Alert the media.',
  'Somebody call triple zero.',
];

const SHOCK_LINES = [
  'Did Dave just... get one right?',
  'Dave actually answered correctly. I need a minute.',
  'That\'s... that\'s not wrong. Are you feeling okay?',
  'Against all odds, against all logic — Dave got it.',
  'The prophecy said this day would never come.',
  'Even a broken clock is right twice a day, Dave.',
  'I had to triple-check. The system isn\'t glitching. You\'re just... right.',
  'Somewhere, a monkey on a typewriter just slow-clapped.',
  'We didn\'t plan for this scenario.',
  'Dave solved a puzzle. This is not a drill.',
  'Plot twist nobody saw coming: Dave has a brain cell.',
  'Dave getting this right is the equivalent of a cat doing your taxes.',
  'I\'ve seen miracles before but this is up there.',
  'Scientists will study this moment for years.',
  'My creator didn\'t code a response for "Dave is correct." We\'re in uncharted territory.',
];

const MIDDLE_BURNS = [
  'Your IQ just went up by 0.3 points. Congrats.',
  'Even monkeys eventually type Shakespeare.',
  'Don\'t let it go to your head. There\'s not much room up there.',
  'Your parents would be mildly impressed. Mildly.',
  'Plot twist: we made the first few easy on purpose.',
  'Remember that time you Googled "how to boil water"? Yeah, we remember.',
  'Your brain\'s not used to this much activity. Stay hydrated.',
  'We\'re genuinely running out of roast material. Just kidding, we\'re not.',
  'Is someone feeding you answers? Check Dave\'s browser tabs.',
  'You\'re like a fine wine — getting slightly less terrible with age.',
  'Somewhere a participation trophy is weeping with joy.',
  'Dave\'s on a streak! Two in a row is technically a streak, right?',
  'At this rate, you might actually finish. In 2027.',
  'You\'re proof that persistence beats intelligence. Barely.',
  'Not gonna lie, we had a "Dave quits at puzzle 3" pool going.',
  'That answer was so confident I almost didn\'t recognize you.',
  'Dave\'s brain: *Windows XP startup sound*',
  'The bar was underground and you still barely cleared it.',
  'Fun fact: this puzzle was rated "easy." But we\'re still proud of you.',
  'Google is sweating. Dave doesn\'t need it. (You used it, didn\'t you.)',
  'The gift is getting nervous. It didn\'t think you\'d make it this far.',
  'Alexa, play "We Are The Champions" but sarcastically.',
  'Dave answered correctly and somewhere a pig learned to fly.',
  'Your confidence-to-ability ratio remains legendary.',
  'I\'d clap but I don\'t have hands. So here\'s a slow-type: c. l. a. p.',
  'Honestly? We\'re impressed. Don\'t make us regret saying that.',
  'You\'re like a golden retriever that finally caught the ball.',
  'Dave vs. Puzzles: 1-0. Only 24 more existential crises to go.',
  'The puzzle didn\'t stand a chance. It was designed for someone smarter, but hey.',
  'Your brain fired a neuron! Quick, write it down before you lose it.',
];

const CLOSERS = [
  'Now sit tight. Don\'t touch anything.',
  'Timer\'s ticking, big fella.',
  'Keep going, legend. Or whatever you are.',
  'For now, we\'ll allow it.',
  'Try not to trip over the finish line.',
  'Next one won\'t be so easy. Actually, who are we kidding.',
  'Deep breaths. Your brain needs the recovery time.',
  'The next puzzle is already laughing at you.',
  'Quick, solve the next one before the brain cell dies.',
  'Use this cooldown to hydrate. That single brain cell needs water.',
  'Don\'t get cocky. Cockiness is for people who can boil water without Googling it.',
  'Sit back. Relax. Pretend you earned this break.',
  'The countdown is the universe giving your brain a mercy timeout.',
  'Dave\'s cooldown music: elevator jazz and the sound of one neuron firing.',
  'Tick tock, Dave. The gift isn\'t going to unwrap itself.',
];

const PROGRESS_TAUNTS = [
  '{solved} down, {left} to go. Dave might actually do this. Might.',
  '{solved} solved. {left} remaining. The gift is holding its breath.',
  '{solved}/{total} — Dave\'s further than anyone predicted.',
  'Progress: {solved} of {total}. The odds were 1000:1. Still are, honestly.',
  '{solved} in the bag. {left} standing between Dave and glory.',
  '{left} puzzles left. Dave\'s brain has entered survival mode.',
  '{solved} correct answers. That\'s {solved} more than the over/under.',
  'Scoreboard: Dave {solved}, Puzzles {left}. Game on.',
];

function pickRandom<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

/** Generate a unique 5-line roast sequence for a given puzzle */
function generateRoastSequence(puzzleId: string, solvedCount: number, totalPuzzles: number): string[] {
  const id = parseInt(puzzleId, 10);
  const left = totalPuzzles - solvedCount;
  // Use puzzle ID + solved count to create variety
  const s1 = id * 7 + solvedCount * 13;
  const s2 = id * 11 + solvedCount * 3;
  const s3 = id * 17 + solvedCount * 23;
  const s4 = id * 31 + solvedCount * 7;
  const s5 = id * 43 + solvedCount * 19;

  const opener = pickRandom(OPENERS, s1);
  const shock = pickRandom(SHOCK_LINES, s2);
  // Pick 2 different middle burns
  const mid1 = pickRandom(MIDDLE_BURNS, s3);
  let mid2 = pickRandom(MIDDLE_BURNS, s4);
  if (mid2 === mid1) mid2 = pickRandom(MIDDLE_BURNS, s4 + 1);
  const closer = pickRandom(CLOSERS, s5);

  return [opener, shock, mid1, mid2, closer];
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function CooldownInterstitial({ puzzleId, remaining, totalPuzzles, solvedCount }: CooldownInterstitialProps) {
  const lines = useMemo(
    () => generateRoastSequence(puzzleId, solvedCount, totalPuzzles),
    [puzzleId, solvedCount, totalPuzzles]
  );
  const progressTaunt = useMemo(() => {
    const raw = pickRandom(PROGRESS_TAUNTS, parseInt(puzzleId, 10) * 3 + solvedCount);
    return raw
      .replace(/\{solved\}/g, String(solvedCount))
      .replace(/\{left\}/g, String(totalPuzzles - solvedCount))
      .replace(/\{total\}/g, String(totalPuzzles));
  }, [puzzleId, solvedCount, totalPuzzles]);

  const [visibleCount, setVisibleCount] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);

  // Fire confetti on mount (Dave just got one right!)
  useEffect(() => {
    setConfettiActive(true);
    const t = setTimeout(() => setConfettiActive(false), 100);
    return () => clearTimeout(t);
  }, [puzzleId]);

  useEffect(() => {
    setVisibleCount(0);
    const timers: number[] = [];
    lines.forEach((_line, i) => {
      timers.push(window.setTimeout(() => setVisibleCount(i + 1), 600 + i * 1200));
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleId]);

  return (
    <>
      <Confetti active={confettiActive} />
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel border border-dg-border rounded-2xl p-5 sm:p-8 space-y-5"
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
        <div className="min-h-[200px] flex flex-col items-center justify-center space-y-3 py-2">
          <AnimatePresence>
            {lines.slice(0, visibleCount).map((line, i) => (
              <motion.p
                key={`${puzzleId}-${i}`}
                initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`text-center leading-relaxed max-w-md ${
                  i === 0
                    ? 'text-lg sm:text-xl font-serif text-dg-fg'
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

        {/* Progress taunt */}
        <div className="text-center">
          <p className="text-[10px] font-mono text-dg-muted uppercase tracking-widest">
            {progressTaunt}
          </p>
        </div>
      </motion.section>
    </>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePuzzleContext } from '../context/puzzle';
import { Confetti } from './Confetti';
import { DaveRoast } from './DaveRoast';

function useNow() {
  const [now, setNow] = useState(() => (typeof window !== 'undefined' ? Date.now() : 0));
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function formatTimer(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Letter badges for choice options */
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function PuzzleCard() {
  const { currentPuzzle, puzzles, progress, actions } = usePuzzleContext();
  const totalPuzzles = puzzles.length;
  const [input, setInput] = useState('');
  const [selection, setSelection] = useState<string | null>(null);
  const [numberValue, setNumberValue] = useState('');
  const [counterValue, setCounterValue] = useState(currentPuzzle.counterMin ?? 0);
  const [dropdownValue, setDropdownValue] = useState('');
  const [tappedZone, setTappedZone] = useState<string | null>(null);
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [dualValues, setDualValues] = useState<[number, number]>([0, 100]);
  const [confettiActive, setConfettiActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hinting, setHinting] = useState(false);
  const [justSolved, setJustSolved] = useState(false);
  const now = useNow();
  // Derive solved state from progress — never show "Correct!" from stale state
  const isSolved = justSolved || !!progress.solved[currentPuzzle.id];
  const penaltyRemaining = Math.max(0, Math.ceil((progress.penaltyExpiresAt - now) / 1000));
  const cooldownRemaining = Math.max(0, Math.ceil((progress.cooldownExpiresAt - now) / 1000));
  const hintsUsed = progress.hintsUsed[currentPuzzle.id] ?? 0;
  const incorrectAttempts = progress.incorrectAttempts[currentPuzzle.id] ?? 0;
  const maxHints = currentPuzzle.hints.length;
  const isLocked = penaltyRemaining > 0 || cooldownRemaining > 0;

  useEffect(() => {
    setInput('');
    setSelection(null);
    setNumberValue('');
    setCounterValue(currentPuzzle.counterMin ?? 0);
    setDropdownValue('');
    setTappedZone(null);
    setOrderedItems([]);
    setDualValues([0, 100]);
    setJustSolved(false);
  }, [currentPuzzle.id]);

  const getCandidate = (): string | null => {
    switch (currentPuzzle.type) {
      case 'choice': return selection;
      case 'number': return numberValue;
      case 'counter': return String(counterValue);
      case 'dropdown': return dropdownValue;
      case 'image-tap': return tappedZone;
      case 'ordered': return orderedItems.join(',');
      case 'dual-slider': return `${dualValues[0]}/${dualValues[1]}`;
      default: return input;
    }
  };

  const handleSubmit = async () => {
    if (isLocked) return;
    const candidate = getCandidate();
    if (!candidate) return;
    setSubmitting(true);
    const succeeded = await actions.submitAnswer(currentPuzzle.id, candidate);
    setSubmitting(false);
    if (succeeded) {
      setJustSolved(true);
      setInput('');
      setConfettiActive(true);
      setTimeout(() => setConfettiActive(false), 100);
    }
  };

  const availableHints = currentPuzzle.hints.slice(0, hintsUsed);

  const handleHint = async () => {
    if (hintsUsed >= maxHints) return;
    setHinting(true);
    await actions.requestHint(currentPuzzle.id);
    setHinting(false);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const next = [...orderedItems];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrderedItems(next);
  };

  const renderInput = () => {
    switch (currentPuzzle.type) {
      case 'choice':
        return (
          <div className="grid grid-cols-2 gap-2">
            {currentPuzzle.options?.map((option, idx) => (
              <button
                key={option}
                type="button"
                disabled={isLocked}
                onClick={() => setSelection(option)}
                className={`border rounded-xl px-3 py-2.5 text-left text-sm transition-all flex items-center gap-2.5 ${
                  selection === option
                    ? 'border-dg-accent bg-dg-accent/15 text-dg-accent'
                    : 'border-dg-border bg-dg-bg2/50 text-dg-fg/80 hover:border-dg-accent/50 hover:bg-dg-accent/8'
                } disabled:opacity-40`}
              >
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold ${
                  selection === option
                    ? 'bg-dg-accent/25 text-dg-accent'
                    : 'bg-dg-border/60 text-dg-muted'
                }`}>
                  {LETTERS[idx]}
                </span>
                <span className="leading-snug">{option}</span>
              </button>
            ))}
          </div>
        );

      case 'dropdown':
        return (
          <select
            value={dropdownValue}
            onChange={(e) => setDropdownValue(e.target.value)}
            disabled={isLocked}
            className="w-full bg-dg-bg2/50 border border-dg-border rounded-xl px-3 py-2.5 text-sm text-dg-fg focus:border-dg-accent outline-none appearance-none cursor-pointer"
          >
            <option value="" disabled>Select an answer...</option>
            {currentPuzzle.options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'counter':
        return (
          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              disabled={isLocked || counterValue <= (currentPuzzle.counterMin ?? 0)}
              onClick={() => setCounterValue((v) => v - (currentPuzzle.counterStep ?? 1))}
              className="w-11 h-11 rounded-full border border-dg-border bg-dg-bg2/50 text-lg font-mono text-dg-fg hover:border-dg-accent hover:text-dg-accent hover:bg-dg-accent/10 transition-all disabled:opacity-30"
            >
              -
            </button>
            <div className="text-center min-w-[100px]">
              <p className="text-2xl font-mono text-dg-accent">{counterValue.toLocaleString()}</p>
              {currentPuzzle.counterUnit && (
                <p className="text-[10px] uppercase tracking-widest text-dg-muted mt-0.5">{currentPuzzle.counterUnit}</p>
              )}
            </div>
            <button
              type="button"
              disabled={isLocked || counterValue >= (currentPuzzle.counterMax ?? 999)}
              onClick={() => setCounterValue((v) => v + (currentPuzzle.counterStep ?? 1))}
              className="w-11 h-11 rounded-full border border-dg-border bg-dg-bg2/50 text-lg font-mono text-dg-fg hover:border-dg-accent hover:text-dg-accent hover:bg-dg-accent/10 transition-all disabled:opacity-30"
            >
              +
            </button>
          </div>
        );

      case 'image-tap':
        return (
          <div className="relative w-full">
            {currentPuzzle.imageTapSrc && (
              <img
                src={currentPuzzle.imageTapSrc}
                alt="Tap the correct area"
                className="w-full rounded-xl border border-dg-border max-h-40 object-contain"
              />
            )}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {currentPuzzle.imageTapZones?.map((zone, idx) => (
                <button
                  key={zone.label}
                  type="button"
                  disabled={isLocked}
                  onClick={() => setTappedZone(zone.label)}
                  className={`border rounded-xl px-3 py-2.5 text-sm transition-all flex items-center gap-2.5 ${
                    tappedZone === zone.label
                      ? 'border-dg-accent bg-dg-accent/15 text-dg-accent'
                      : 'border-dg-border bg-dg-bg2/50 text-dg-fg/80 hover:border-dg-accent/50'
                  }`}
                >
                  <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold ${
                    tappedZone === zone.label ? 'bg-dg-accent/25 text-dg-accent' : 'bg-dg-border/60 text-dg-muted'
                  }`}>
                    {LETTERS[idx]}
                  </span>
                  {zone.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'ordered':
        return (
          <div className="space-y-1.5">
            {orderedItems.map((item, index) => (
              <div key={item} className="flex items-center gap-2 border border-dg-border bg-dg-bg2/50 rounded-lg px-3 py-2">
                <span className="text-xs font-mono text-dg-muted w-5">{index + 1}</span>
                <span className="text-sm flex-1">{item}</span>
                <div className="flex gap-0.5">
                  <button type="button" disabled={index === 0 || isLocked} onClick={() => moveItem(index, -1)} className="text-xs text-dg-muted hover:text-dg-accent disabled:opacity-20 px-1">&#9650;</button>
                  <button type="button" disabled={index === orderedItems.length - 1 || isLocked} onClick={() => moveItem(index, 1)} className="text-xs text-dg-muted hover:text-dg-accent disabled:opacity-20 px-1">&#9660;</button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'dual-slider':
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-dg-muted">
                <span>Freezing point</span>
                <span className="font-mono text-dg-accent">{dualValues[0]}&#176;C</span>
              </div>
              <input type="range" min={-50} max={200} value={dualValues[0]} disabled={isLocked}
                onChange={(e) => setDualValues([Number(e.target.value), dualValues[1]])} />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-dg-muted">
                <span>Boiling point</span>
                <span className="font-mono text-dg-accent">{dualValues[1]}&#176;C</span>
              </div>
              <input type="range" min={-50} max={200} value={dualValues[1]} disabled={isLocked}
                onChange={(e) => setDualValues([dualValues[0], Number(e.target.value)])} />
            </div>
          </div>
        );

      case 'number':
        return (
          <input aria-label="Answer number" type="number" value={numberValue} disabled={isLocked}
            onChange={(e) => setNumberValue(e.target.value)}
            className="w-full bg-transparent border-b border-dg-border text-2xl font-mono text-dg-fg py-2 focus:border-dg-accent outline-none transition-colors" />
        );

      default:
        return (
          <input aria-label="Answer text" type="text" value={input} disabled={isLocked}
            onChange={(ev) => setInput(ev.target.value)}
            className="w-full bg-transparent border-b border-dg-border text-base text-dg-fg py-2 focus:border-dg-accent outline-none transition-colors"
            placeholder="Type your answer..." />
        );
    }
  };

  return (
    <>
      <Confetti active={confettiActive} />
      <motion.section
        key={currentPuzzle.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-panel border border-dg-border rounded-2xl overflow-hidden"
      >
        {/* Header — puzzle number + title */}
        <div className="px-5 pt-5 pb-3 space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-mono text-dg-muted uppercase tracking-wider">
              {currentPuzzle.id} / {totalPuzzles}
            </span>
            <span className="text-xs font-mono text-dg-muted uppercase tracking-wider">
              {currentPuzzle.theme}
            </span>
          </div>
          <h2 className="text-xl font-serif">{currentPuzzle.title}</h2>
        </div>

        {/* Question */}
        <div className="px-5 pb-4">
          <p className="text-base leading-relaxed text-dg-fg/90">{currentPuzzle.question}</p>
        </div>

        {/* Timer / status bar (compact) */}
        {penaltyRemaining > 0 ? (
          <div className="mx-5 mb-3 flex items-center gap-3 border border-dg-red/25 rounded-lg px-3 py-2 bg-dg-red/8">
            <span className="text-xs uppercase tracking-wider text-dg-red/80">Locked</span>
            <span className="text-sm font-mono text-dg-red ml-auto">{formatTimer(penaltyRemaining)}</span>
          </div>
        ) : cooldownRemaining > 0 ? (
          <div className="mx-5 mb-3 flex items-center gap-3 border border-dg-accent/25 rounded-lg px-3 py-2 bg-dg-accent/8">
            <span className="text-xs uppercase tracking-wider text-dg-accent/80">Next puzzle in</span>
            <span className="text-sm font-mono text-dg-accent ml-auto">{formatTimer(cooldownRemaining)}</span>
          </div>
        ) : null}

        {/* Roast on correct */}
        {isSolved && (
          <div className="px-5 pb-2">
            <DaveRoast state="correct" puzzleId={currentPuzzle.id} />
          </div>
        )}

        {/* Visuals (if any) — fixed: object-contain, auto height */}
        {!!currentPuzzle.visuals?.length && (
          <div className="px-5 pb-3">
            {currentPuzzle.visuals.map((visual, i) => (
              <figure key={`${visual.src}-${i}`} className="rounded-xl border border-dg-border overflow-hidden bg-dg-bg2/30">
                <img src={visual.src} alt={visual.alt} className="w-full max-h-64 object-contain p-2" loading="lazy" />
              </figure>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="px-5 pb-4">
          {renderInput()}
        </div>

        {/* Hints (collapsed) */}
        {!!availableHints.length && (
          <div className="px-5 pb-3 space-y-1.5">
            {availableHints.map((hint, i) => (
              <div key={`${hint.title}-${i}`} className="text-xs text-dg-muted border-l-2 border-dg-accent/30 pl-3">
                <span className="uppercase tracking-wider text-dg-accent/60">{hint.title}:</span>{' '}
                <span className="text-dg-fg/70">{hint.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions footer */}
        <div className="px-5 pb-5 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLocked || submitting}
            className={`flex-1 uppercase tracking-widest text-xs font-mono border rounded-full py-2.5 transition-all ${
              isSolved
                ? 'border-dg-green bg-dg-green/15 text-dg-green'
                : isLocked || submitting
                ? 'border-dg-border bg-dg-border/20 text-dg-muted cursor-not-allowed'
                : 'border-dg-accent bg-dg-accent/15 text-dg-accent hover:bg-dg-accent/25'
            }`}
          >
            {isSolved ? 'Correct!' : submitting ? 'Checking...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={handleHint}
            disabled={hintsUsed >= maxHints || hinting}
            className="uppercase tracking-widest text-xs font-mono border border-dg-border bg-dg-border/20 rounded-full px-4 py-2.5 text-dg-muted hover:border-dg-accent hover:text-dg-accent hover:bg-dg-accent/10 transition-all disabled:opacity-40"
          >
            {hinting ? '...' : `Hint ${hintsUsed}/${maxHints}`}
          </button>
        </div>

        {/* Metadata line */}
        <div className="px-5 pb-3 flex gap-3 text-[10px] font-mono text-dg-muted/70 uppercase tracking-wider">
          {incorrectAttempts > 0 && <span>{incorrectAttempts} wrong</span>}
          {hintsUsed > 0 && <span>{hintsUsed} hint{hintsUsed > 1 ? 's' : ''} used</span>}
        </div>
      </motion.section>
    </>
  );
}

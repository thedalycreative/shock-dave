import { useEffect, useMemo, useState } from 'react';
import { usePuzzleContext } from '../context/puzzle';

function useNow() {
  const [now, setNow] = useState(() => (typeof window !== 'undefined' ? Date.now() : 0));
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function PuzzleCard() {
  const { currentPuzzle, progress, actions } = usePuzzleContext();
  const [input, setInput] = useState('');
  const [selection, setSelection] = useState<string | null>(null);
  const [numberValue, setNumberValue] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hinting, setHinting] = useState(false);
  const now = useNow();
  const penaltyRemaining = Math.max(0, Math.ceil((progress.penaltyExpiresAt - now) / 1000));
  const cooldownRemaining = Math.max(0, Math.ceil((progress.cooldownExpiresAt - now) / 1000));
  const hintsUsed = progress.hintsUsed[currentPuzzle.id] ?? 0;
  const incorrectAttempts = progress.incorrectAttempts[currentPuzzle.id] ?? 0;
  const maxHints = currentPuzzle.hints.length;

  useEffect(() => {
    if (progress.solved[currentPuzzle.id] && !success) {
      setSuccess(true);
    }
  }, [progress.solved, currentPuzzle.id, success]);

  const handleSubmit = async () => {
    if (penaltyRemaining > 0) return;
    const candidate =
      currentPuzzle.type === 'choice'
        ? selection
        : currentPuzzle.type === 'number'
        ? numberValue
        : input;
    if (!candidate) return;
    setSubmitting(true);
    const succeeded = await actions.submitAnswer(currentPuzzle.id, candidate);
    setSubmitting(false);
    setSuccess(succeeded);
    setInput('');
  };

  const availableHints = currentPuzzle.hints.slice(0, hintsUsed);

  const hintButtonLabel =
    hintsUsed >= maxHints ? 'Hints exhausted' : `Reveal hint (${hintsUsed}/${maxHints})`;

  const handleHint = async () => {
    if (hintsUsed >= maxHints) return;
    setHinting(true);
    await actions.requestHint(currentPuzzle.id);
    setHinting(false);
  };

  return (
    <section className="glass-panel border border-dg-border p-8 space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-[13px] uppercase tracking-[0.4em] text-dg-muted">Progress tracker</p>
        <h3 className="text-[18px] font-mono uppercase tracking-[0.5em] text-dg-accent">
          Penalty {penaltyRemaining ? `(wait ${penaltyRemaining}s)` : 'ready'}
        </h3>
      </div>

      {currentPuzzle.visuals?.length ? (
        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-dg-border">
          {currentPuzzle.visuals.map((visual, index) => (
            <figure
              key={`${visual.src}-${index}`}
              className="rounded-2xl border border-dg-border bg-dg-bg/40 overflow-hidden"
            >
              <img
                src={visual.src}
                alt={visual.alt}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
              {visual.caption && (
                <figcaption className="p-3 text-[12px] uppercase tracking-[0.3em] text-dg-muted">
                  {visual.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="space-y-3">
          {currentPuzzle.type === 'choice' && currentPuzzle.options ? (
            <div className="grid grid-cols-2 gap-3">
              {currentPuzzle.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelection(option)}
                  className={`border rounded-2xl px-4 py-3 text-left font-serif text-[16px] ${
                    selection === option
                      ? 'border-dg-accent bg-dg-adim text-dg-accent'
                      : 'border-dg-border text-dg-fg/70 hover:border-dg-accent hover:bg-dg-adim'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : currentPuzzle.type === 'number' ? (
            <input
              aria-label="Answer number"
              type="number"
              value={numberValue}
              onChange={(event) => setNumberValue(event.target.value)}
              className="w-full bg-transparent border-b border-dg-border text-[32px] font-serif text-dg-fg py-3 focus:border-dg-accent outline-none transition-colors"
            />
          ) : (
            <input
              aria-label="Answer text"
              type="text"
              value={input}
              onChange={(ev) => setInput(ev.target.value)}
              className="w-full bg-transparent border-b border-dg-border text-[20px] font-serif text-dg-fg py-3 focus:border-dg-accent outline-none transition-colors"
              placeholder="Type your answer…"
            />
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={penaltyRemaining > 0 || submitting}
            className={`uppercase tracking-[0.4em] text-[11px] font-mono border rounded-full px-8 py-3 transition-colors ${
              penaltyRemaining > 0 || submitting
                ? 'border-dg-border text-dg-muted cursor-not-allowed bg-transparent'
                : 'border-dg-accent text-dg-accent hover:bg-dg-accent/10'
            }`}
          >
            {success ? 'Password unlocked' : submitting ? 'Submitting…' : 'Submit answer'}
          </button>
          <button
            type="button"
            onClick={handleHint}
            disabled={hintsUsed >= maxHints || hinting}
            className="uppercase tracking-[0.4em] text-[11px] font-mono border border-dg-border rounded-full px-8 py-3 hover:border-dg-accent hover:text-dg-accent transition-colors"
          >
            {hinting ? 'Revealing hint…' : hintButtonLabel}
          </button>
        </div>
      </div>

      <div className="text-[12px] text-dg-muted flex flex-wrap gap-4">
        <span>Incorrect attempts: {incorrectAttempts}</span>
        <span>Hints used: {hintsUsed}/{maxHints}</span>
        <span>Cooldown: {cooldownRemaining ? `${cooldownRemaining}s` : 'ready'}</span>
      </div>

      {!!availableHints.length && (
        <div className="space-y-3 pt-4 border-t border-dg-border">
          {availableHints.map((hint, index) => (
            <div key={`${hint.title}-${index}`}>
              <p className="text-[12px] uppercase tracking-[0.4em] text-dg-muted">{hint.title}</p>
              <p className="text-[16px]">{hint.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

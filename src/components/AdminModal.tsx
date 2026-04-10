import React, { useMemo, useState } from 'react';
import { usePuzzleContext } from '../context/puzzle';
import type { PuzzleId } from '../types/puzzle';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

function formatEta(totalSeconds: number): string {
  const now = new Date();
  const eta = new Date(now.getTime() + totalSeconds * 1000);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const diffMs = eta.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const hour = eta.getHours();
  let timeOfDay: string;
  if (hour < 6) timeOfDay = 'early morning';
  else if (hour < 12) timeOfDay = 'morning';
  else if (hour < 14) timeOfDay = 'midday';
  else if (hour < 17) timeOfDay = 'afternoon';
  else if (hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';

  if (diffHours < 1) return `in about ${Math.ceil(diffHours * 60)} minutes`;
  if (diffHours < 2) return `in about ${Math.round(diffHours * 60)} minutes`;

  const isToday = eta.getDate() === now.getDate() && eta.getMonth() === now.getMonth();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = eta.getDate() === tomorrow.getDate() && eta.getMonth() === tomorrow.getMonth();

  if (isToday) return `today, ${timeOfDay}`;
  if (isTomorrow) return `tomorrow ${timeOfDay}`;
  if (diffDays < 7) return `${days[eta.getDay()]} ${timeOfDay}`;
  return `${Math.ceil(diffDays)} days from now`;
}

export function AdminModal() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [saved, setSaved] = useState(false);
  const { puzzles, progress, adminActions, disabledPuzzles, puzzleTimingOverrides } = usePuzzleContext();
  const solvedCount = Object.keys(progress.solved).length;
  const hintsTotal = Object.values(progress.hintsUsed).reduce((a, c) => a + c, 0);
  const attemptsTotal = Object.values(progress.incorrectAttempts).reduce((a, c) => a + c, 0);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password.trim() === 'admin') {
      setAuthorized(true);
    }
  };

  const getPuzzleStatus = (id: PuzzleId): 'solved' | 'active' | 'locked' => {
    if (progress.solved[id]) return 'solved';
    if (progress.currentPuzzle === id) return 'active';
    return 'locked';
  };

  // Calculate earliest possible finish: sum of cooldowns for all unsolved, enabled puzzles
  const { totalCooldownSeconds, etaLabel } = useMemo(() => {
    let total = 0;
    for (const puzzle of puzzles) {
      if (disabledPuzzles.has(puzzle.id)) continue;
      if (progress.solved[puzzle.id]) continue;
      const overrides = puzzleTimingOverrides[puzzle.id] ?? {};
      total += overrides.cooldownMin ?? puzzle.cooldownMin;
    }
    return { totalCooldownSeconds: total, etaLabel: formatEta(total) };
  }, [puzzles, disabledPuzzles, progress.solved, puzzleTimingOverrides]);

  const handleSave = () => {
    adminActions.saveAll();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full border border-dg-border text-dg-accent flex items-center justify-center bg-black/60 backdrop-blur-lg"
        aria-label="Open admin panel"
      >
        &#9881;
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="glass-panel border border-dg-border w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-dg-border shrink-0">
              <h3 className="text-[20px] font-serif font-light">Admin control center</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-dg-muted hover:text-dg-fg text-xl leading-none p-1"
                aria-label="Close admin panel"
              >
                &#10005;
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-6 admin-scrollbar">
              {!authorized ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-[14px] text-dg-muted">Enter admin password to access controls.</p>
                  <input
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    type="password"
                    placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                    className="w-full bg-transparent border-b border-dg-border focus:border-dg-accent text-dg-fg py-2 outline-none"
                  />
                  <button
                    type="submit"
                    className="uppercase tracking-[0.4em] text-[11px] font-mono border border-dg-accent text-dg-accent px-4 py-2 rounded-full hover:bg-dg-accent/10 transition-colors"
                  >
                    Unlock
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Stats + ETA */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-4 text-[13px] text-dg-muted font-mono">
                      <span>Solved: {solvedCount} / {puzzles.length}</span>
                      <span>Incorrect: {attemptsTotal}</span>
                      <span>Hints: {hintsTotal}</span>
                    </div>
                    <div className="border border-dg-accent/30 rounded-xl p-4 bg-dg-accent/5">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-dg-accent/70 mb-1">Earliest possible finish</p>
                      <p className="text-[18px] font-serif text-dg-accent">{etaLabel}</p>
                      <p className="text-[12px] text-dg-muted font-mono mt-1">
                        {puzzles.length - solvedCount - disabledPuzzles.size} remaining &middot; {formatDuration(totalCooldownSeconds)} total cooldown
                      </p>
                    </div>
                  </div>

                  {/* Puzzle list */}
                  <div className="space-y-3">
                    {puzzles.map((puzzle) => {
                      const status = getPuzzleStatus(puzzle.id);
                      const isDisabled = disabledPuzzles.has(puzzle.id);
                      const overrides = puzzleTimingOverrides[puzzle.id] ?? {};
                      const cooldown = overrides.cooldownMin ?? puzzle.cooldownMin;
                      const penaltyBase = overrides.penaltyBase ?? puzzle.penaltyBase;
                      const penaltyInc = overrides.penaltyIncrement ?? puzzle.penaltyIncrement;

                      return (
                        <div
                          key={puzzle.id}
                          className={`border rounded-xl p-4 space-y-3 transition-opacity ${
                            isDisabled ? 'border-dg-border/50 opacity-50' : 'border-dg-border'
                          }`}
                        >
                          {/* Puzzle header */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-[11px] uppercase tracking-[0.3em] text-dg-muted shrink-0">
                                #{puzzle.id}
                              </span>
                              <span className="text-[15px] font-serif truncate">{puzzle.title}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => adminActions.togglePuzzle(puzzle.id, isDisabled)}
                              className={`text-[10px] uppercase tracking-[0.3em] font-mono px-3 py-1 rounded-full border transition-colors ${
                                isDisabled
                                  ? 'border-dg-red/40 text-dg-red hover:bg-dg-red/10'
                                  : 'border-dg-green/40 text-dg-green hover:bg-dg-green/10'
                              }`}
                            >
                              {isDisabled ? 'Off' : 'On'}
                            </button>
                          </div>

                          {/* Answer */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-[0.2em] text-dg-muted w-14 shrink-0">Answer</span>
                            <span className="text-[13px] font-mono text-dg-accent">{puzzle.demoAnswer ?? '—'}</span>
                          </div>

                          {/* Status selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] uppercase tracking-[0.2em] text-dg-muted w-14 shrink-0">Status</span>
                            <div className="flex gap-1">
                              {(['solved', 'active', 'locked'] as const).map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => adminActions.setPuzzleStatus(puzzle.id, s)}
                                  className={`text-[10px] uppercase tracking-[0.2em] font-mono px-3 py-1 rounded-full border transition-colors ${
                                    status === s
                                      ? s === 'solved'
                                        ? 'border-dg-green bg-dg-green/15 text-dg-green'
                                        : s === 'active'
                                        ? 'border-dg-accent bg-dg-accent/15 text-dg-accent'
                                        : 'border-dg-muted bg-dg-muted/15 text-dg-muted'
                                      : 'border-dg-border text-dg-muted/60 hover:border-dg-muted'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Timing controls */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-[0.2em] text-dg-muted block">
                                Wait between Qs
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={cooldown}
                                  onChange={(e) => adminActions.updatePuzzleTiming(puzzle.id, { cooldownMin: Number(e.target.value) })}
                                  className="w-full bg-transparent border-b border-dg-border focus:border-dg-accent text-dg-fg text-[13px] font-mono py-1 outline-none"
                                />
                                <span className="text-[10px] text-dg-muted shrink-0">s</span>
                              </div>
                              <span className="text-[10px] text-dg-muted/60">{formatDuration(cooldown)}</span>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-[0.2em] text-dg-muted block">
                                Wrong/hint lock
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={penaltyBase}
                                  onChange={(e) => adminActions.updatePuzzleTiming(puzzle.id, { penaltyBase: Number(e.target.value) })}
                                  className="w-full bg-transparent border-b border-dg-border focus:border-dg-accent text-dg-fg text-[13px] font-mono py-1 outline-none"
                                />
                                <span className="text-[10px] text-dg-muted shrink-0">s</span>
                              </div>
                              <span className="text-[10px] text-dg-muted/60">{formatDuration(penaltyBase)}</span>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-[0.2em] text-dg-muted block">
                                +per wrong
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={penaltyInc}
                                  onChange={(e) => adminActions.updatePuzzleTiming(puzzle.id, { penaltyIncrement: Number(e.target.value) })}
                                  className="w-full bg-transparent border-b border-dg-border focus:border-dg-accent text-dg-fg text-[13px] font-mono py-1 outline-none"
                                />
                                <span className="text-[10px] text-dg-muted shrink-0">s</span>
                              </div>
                              <span className="text-[10px] text-dg-muted/60">+{formatDuration(penaltyInc)}/try</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {authorized && (
              <div className="flex flex-wrap gap-3 p-6 pt-4 border-t border-dg-border shrink-0">
                <button
                  type="button"
                  onClick={() => { if (confirm('Reset all progress? This cannot be undone.')) adminActions.resetJourney(); }}
                  className="px-4 py-2 border border-dg-red/40 text-dg-red rounded-full text-[11px] uppercase tracking-[0.3em] font-mono hover:bg-dg-red/10 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={`px-5 py-2 rounded-full text-[11px] uppercase tracking-[0.3em] font-mono transition-colors ${
                    saved
                      ? 'border border-dg-green bg-dg-green/15 text-dg-green'
                      : 'border border-dg-accent bg-dg-accent/10 text-dg-accent hover:bg-dg-accent/20'
                  }`}
                >
                  {saved ? 'Saved' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 border border-dg-border rounded-full text-[11px] uppercase tracking-[0.3em] font-mono text-dg-muted hover:border-dg-accent hover:text-dg-accent transition-colors ml-auto"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

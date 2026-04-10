import React, { useState } from 'react';
import { usePuzzleContext } from '../context/puzzle';
import type { PuzzleId } from '../types/puzzle';

export function AdminModal() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
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

  const formatSeconds = (s: number) => {
    if (s >= 3600) return `${Math.round(s / 60)}m`;
    if (s >= 60) return `${Math.round(s / 60)}m`;
    return `${s}s`;
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
            {/* Header - always visible */}
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
                  {/* Stats row */}
                  <div className="flex flex-wrap gap-4 text-[13px] text-dg-muted font-mono">
                    <span>Solved: {solvedCount} / {puzzles.length}</span>
                    <span>Incorrect: {attemptsTotal}</span>
                    <span>Hints: {hintsTotal}</span>
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
                          {/* Puzzle header row */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-[11px] uppercase tracking-[0.3em] text-dg-muted shrink-0">
                                #{puzzle.id}
                              </span>
                              <span className="text-[15px] font-serif truncate">{puzzle.title}</span>
                            </div>
                            {/* Toggle on/off */}
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
                                Cooldown
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={cooldown}
                                  onChange={(e) => adminActions.updatePuzzleTiming(puzzle.id, { cooldownMin: Number(e.target.value) })}
                                  className="w-full bg-transparent border-b border-dg-border focus:border-dg-accent text-dg-fg text-[13px] font-mono py-1 outline-none"
                                />
                                <span className="text-[10px] text-dg-muted shrink-0">s ({formatSeconds(cooldown)})</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-[0.2em] text-dg-muted block">
                                Penalty
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
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-[0.2em] text-dg-muted block">
                                Increment
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
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer - always visible */}
            {authorized && (
              <div className="flex flex-wrap gap-3 p-6 pt-4 border-t border-dg-border shrink-0">
                <button
                  type="button"
                  onClick={() => { if (confirm('Reset all progress? This cannot be undone.')) adminActions.resetJourney(); }}
                  className="px-4 py-2 border border-dg-red/40 text-dg-red rounded-full text-[11px] uppercase tracking-[0.3em] font-mono hover:bg-dg-red/10 transition-colors"
                >
                  Reset journey
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

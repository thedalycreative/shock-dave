import React, { useMemo, useState } from 'react';
import { usePuzzleContext } from '../context/puzzle';
import { IntroSequence } from './IntroSequence';
import { GiftReveal } from './GiftReveal';
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
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const isToday = eta.getDate() === now.getDate() && eta.getMonth() === now.getMonth();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = eta.getDate() === tomorrow.getDate() && eta.getMonth() === tomorrow.getMonth();
  if (isToday) return `today, ${timeOfDay}`;
  if (isTomorrow) return `tomorrow ${timeOfDay}`;
  if (diffDays < 7) return `${days[eta.getDay()]} ${timeOfDay}`;
  return `${Math.ceil(diffDays)} days from now`;
}

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
}

export function AdminModal({ open, onClose }: AdminModalProps) {
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<'intro' | 'outro' | null>(null);
  const [masterCooldown, setMasterCooldown] = useState('');
  const [masterPenalty, setMasterPenalty] = useState('');
  const [masterIncrement, setMasterIncrement] = useState('');
  const { puzzles, progress, adminActions, disabledPuzzles, puzzleTimingOverrides } = usePuzzleContext();
  const solvedCount = Object.keys(progress.solved).length;
  const hintsTotal = Object.values(progress.hintsUsed).reduce((a, c) => a + c, 0);
  const attemptsTotal = Object.values(progress.incorrectAttempts).reduce((a, c) => a + c, 0);

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (password.trim() === 'admin') setAuthorized(true);
  };

  const getPuzzleStatus = (id: PuzzleId): 'solved' | 'active' | 'locked' => {
    if (progress.solved[id]) return 'solved';
    if (progress.currentPuzzle === id) return 'active';
    return 'locked';
  };

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

  const applyMasterTiming = () => {
    const updates: Record<string, number> = {};
    if (masterCooldown !== '') updates.cooldownMin = Number(masterCooldown);
    if (masterPenalty !== '') updates.penaltyBase = Number(masterPenalty);
    if (masterIncrement !== '') updates.penaltyIncrement = Number(masterIncrement);
    if (Object.keys(updates).length === 0) return;
    for (const puzzle of puzzles) adminActions.updatePuzzleTiming(puzzle.id, updates);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="glass-panel border border-dg-border w-full max-w-lg mx-3 max-h-[90vh] flex flex-col relative text-[12px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dg-border shrink-0">
            <h3 className="text-[16px] font-serif font-light">Admin</h3>
            <button type="button" onClick={onClose} className="text-dg-muted hover:text-dg-fg text-lg leading-none p-1" aria-label="Close admin panel">&#10005;</button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 p-4 admin-scrollbar space-y-4">
            {!authorized ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <p className="text-dg-muted">Enter admin password.</p>
                <input value={password} onChange={(ev) => setPassword(ev.target.value)} type="password" placeholder="Password" autoFocus className="w-full bg-transparent border-b border-dg-border focus:border-dg-accent text-dg-fg py-1.5 outline-none font-mono text-[13px]" />
                <button type="submit" className="uppercase tracking-[0.3em] text-[10px] font-mono border border-dg-accent text-dg-accent px-4 py-1.5 rounded-full hover:bg-dg-accent/10 transition-colors">Unlock</button>
              </form>
            ) : (
              <>
                {/* Stats row */}
                <div className="flex flex-wrap gap-3 text-dg-muted font-mono">
                  <span>{solvedCount}/{puzzles.length} solved</span>
                  <span>{attemptsTotal} wrong</span>
                  <span>{hintsTotal} hints</span>
                </div>

                {/* ETA card */}
                <div className="border border-dg-accent/25 rounded-lg p-3 bg-dg-accent/5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-dg-accent/70">ETA</span>
                    <span className="text-[10px] text-dg-muted font-mono">{puzzles.length - solvedCount - disabledPuzzles.size} left &middot; {formatDuration(totalCooldownSeconds)}</span>
                  </div>
                  <p className="text-[15px] font-serif text-dg-accent mt-0.5">{etaLabel}</p>
                </div>

                {/* Master timing */}
                <div className="border border-dg-accent/20 rounded-lg p-3 bg-dg-accent/5 space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-dg-accent/70">Set all puzzles</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-dg-muted block mb-0.5">Cooldown</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={masterCooldown} onChange={(e) => setMasterCooldown(e.target.value)} placeholder="--" className="w-full bg-transparent border-b border-dg-border focus:border-dg-accent text-dg-fg text-[12px] font-mono py-0.5 outline-none" />
                        <span className="text-[9px] text-dg-muted">s</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-dg-muted block mb-0.5">Penalty</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={masterPenalty} onChange={(e) => setMasterPenalty(e.target.value)} placeholder="--" className="w-full bg-transparent border-b border-dg-border focus:border-dg-accent text-dg-fg text-[12px] font-mono py-0.5 outline-none" />
                        <span className="text-[9px] text-dg-muted">s</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-dg-muted block mb-0.5">+/wrong</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={masterIncrement} onChange={(e) => setMasterIncrement(e.target.value)} placeholder="--" className="w-full bg-transparent border-b border-dg-border focus:border-dg-accent text-dg-fg text-[12px] font-mono py-0.5 outline-none" />
                        <span className="text-[9px] text-dg-muted">s</span>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={applyMasterTiming} className="uppercase tracking-[0.2em] text-[9px] font-mono border border-dg-accent text-dg-accent px-3 py-1 rounded-full hover:bg-dg-accent/10 transition-colors">Apply all</button>
                </div>

                {/* Preview buttons */}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPreview('intro')} className="flex-1 px-3 py-1.5 border border-dg-border rounded-full text-[10px] uppercase tracking-[0.2em] font-mono text-dg-muted hover:border-dg-accent hover:text-dg-accent transition-colors">Intro</button>
                  <button type="button" onClick={() => setPreview('outro')} className="flex-1 px-3 py-1.5 border border-dg-border rounded-full text-[10px] uppercase tracking-[0.2em] font-mono text-dg-muted hover:border-dg-accent hover:text-dg-accent transition-colors">Outro</button>
                </div>

                {/* Puzzle list — compact */}
                <div className="space-y-1.5">
                  {puzzles.map((puzzle) => {
                    const status = getPuzzleStatus(puzzle.id);
                    const isDisabled = disabledPuzzles.has(puzzle.id);
                    const overrides = puzzleTimingOverrides[puzzle.id] ?? {};
                    const cooldown = overrides.cooldownMin ?? puzzle.cooldownMin;
                    const penaltyBase = overrides.penaltyBase ?? puzzle.penaltyBase;
                    const penaltyInc = overrides.penaltyIncrement ?? puzzle.penaltyIncrement;

                    return (
                      <details
                        key={puzzle.id}
                        className={`border rounded-lg overflow-hidden transition-opacity ${isDisabled ? 'border-dg-border/50 opacity-50' : 'border-dg-border'}`}
                      >
                        {/* Compact summary row */}
                        <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none hover:bg-dg-accent/5 transition-colors">
                          <span className="text-[10px] font-mono text-dg-muted w-5 shrink-0">#{puzzle.id}</span>
                          <span className="text-[13px] font-serif flex-1 truncate">{puzzle.title}</span>
                          <span className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded-full border ${
                            status === 'solved' ? 'border-dg-green/40 text-dg-green' :
                            status === 'active' ? 'border-dg-accent/40 text-dg-accent' :
                            'border-dg-border text-dg-muted/60'
                          }`}>{status}</span>
                          <button type="button" onClick={(e) => { e.preventDefault(); adminActions.togglePuzzle(puzzle.id, isDisabled); }}
                            className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full border transition-colors ${
                              isDisabled ? 'border-dg-red/40 text-dg-red' : 'border-dg-green/40 text-dg-green'
                            }`}>{isDisabled ? 'Off' : 'On'}</button>
                        </summary>

                        {/* Expanded detail */}
                        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-dg-border/50">
                          {/* Answer + status controls */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-dg-muted uppercase w-10">Ans</span>
                            <span className="text-[12px] font-mono text-dg-accent capitalize">{puzzle.demoAnswer ?? '--'}</span>
                            <div className="flex gap-1 ml-auto">
                              {(['solved', 'active', 'locked'] as const).map((s) => (
                                <button key={s} type="button" onClick={() => adminActions.setPuzzleStatus(puzzle.id, s)}
                                  className={`text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full border transition-colors ${
                                    status === s
                                      ? s === 'solved' ? 'border-dg-green bg-dg-green/15 text-dg-green'
                                        : s === 'active' ? 'border-dg-accent bg-dg-accent/15 text-dg-accent'
                                        : 'border-dg-muted bg-dg-muted/15 text-dg-muted'
                                      : 'border-dg-border text-dg-muted/50 hover:border-dg-muted'
                                  }`}>{s}</button>
                              ))}
                            </div>
                          </div>

                          {/* Timing row */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[9px] uppercase text-dg-muted block">Wait</label>
                              <div className="flex items-center gap-1">
                                <input type="number" value={cooldown} onChange={(e) => adminActions.updatePuzzleTiming(puzzle.id, { cooldownMin: Number(e.target.value) })} className="w-full bg-transparent border-b border-dg-border focus:border-dg-accent text-dg-fg text-[11px] font-mono py-0.5 outline-none" />
                                <span className="text-[9px] text-dg-muted">s</span>
                              </div>
                              <span className="text-[9px] text-dg-muted/50">{formatDuration(cooldown)}</span>
                            </div>
                            <div>
                              <label className="text-[9px] uppercase text-dg-muted block">Lock</label>
                              <div className="flex items-center gap-1">
                                <input type="number" value={penaltyBase} onChange={(e) => adminActions.updatePuzzleTiming(puzzle.id, { penaltyBase: Number(e.target.value) })} className="w-full bg-transparent border-b border-dg-border focus:border-dg-accent text-dg-fg text-[11px] font-mono py-0.5 outline-none" />
                                <span className="text-[9px] text-dg-muted">s</span>
                              </div>
                              <span className="text-[9px] text-dg-muted/50">{formatDuration(penaltyBase)}</span>
                            </div>
                            <div>
                              <label className="text-[9px] uppercase text-dg-muted block">+/try</label>
                              <div className="flex items-center gap-1">
                                <input type="number" value={penaltyInc} onChange={(e) => adminActions.updatePuzzleTiming(puzzle.id, { penaltyIncrement: Number(e.target.value) })} className="w-full bg-transparent border-b border-dg-border focus:border-dg-accent text-dg-fg text-[11px] font-mono py-0.5 outline-none" />
                                <span className="text-[9px] text-dg-muted">s</span>
                              </div>
                              <span className="text-[9px] text-dg-muted/50">+{formatDuration(penaltyInc)}</span>
                            </div>
                          </div>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {authorized && (
            <div className="flex gap-2 px-4 py-3 border-t border-dg-border shrink-0">
              <button type="button" onClick={() => { if (confirm('Reset all progress?')) adminActions.resetJourney(); }}
                className="px-3 py-1.5 border border-dg-red/40 text-dg-red rounded-full text-[10px] uppercase tracking-[0.2em] font-mono hover:bg-dg-red/10 transition-colors">Reset</button>
              <button type="button" onClick={handleSave}
                className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-mono transition-colors ${
                  saved ? 'border border-dg-green bg-dg-green/15 text-dg-green' : 'border border-dg-accent bg-dg-accent/10 text-dg-accent hover:bg-dg-accent/20'
                }`}>{saved ? 'Saved' : 'Save'}</button>
              <button type="button" onClick={onClose}
                className="px-3 py-1.5 border border-dg-border rounded-full text-[10px] uppercase tracking-[0.2em] font-mono text-dg-muted hover:border-dg-accent hover:text-dg-accent transition-colors ml-auto">Close</button>
            </div>
          )}
        </div>
      </div>

      {/* Preview overlay */}
      {preview && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-dg-bg/95 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setPreview(null); }}>
          <div className="w-full max-w-3xl mx-auto px-4 py-8 overflow-y-auto max-h-screen">
            {preview === 'intro' ? (
              <section className="glass-panel border border-dg-border p-10 text-center space-y-8">
                <IntroSequence onComplete={() => {}} />
              </section>
            ) : (
              <GiftReveal totalPuzzles={puzzles.length} solvedCount={puzzles.length} />
            )}
          </div>
          <button type="button" onClick={() => setPreview(null)}
            className="mt-4 px-6 py-2 border border-dg-border rounded-full text-[11px] uppercase tracking-[0.3em] font-mono text-dg-muted hover:border-dg-accent hover:text-dg-accent transition-colors">Close preview</button>
        </div>
      )}
    </>
  );
}

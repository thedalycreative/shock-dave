import React, { useState } from 'react';
import { usePuzzleContext } from '../context/puzzle';

export function AdminModal() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const { puzzles, progress } = usePuzzleContext();
  const solvedCount = Object.keys(progress.solved).length;
  const hintsTotal = Object.values(progress.hintsUsed).reduce((a, c) => a + c, 0);
  const attemptsTotal = Object.values(progress.incorrectAttempts).reduce((a, c) => a + c, 0);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password.trim() === 'admin') {
      setAuthorized(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full border border-dg-border text-dg-accent flex items-center justify-center bg-black/60 backdrop-blur-lg"
        aria-label="Open admin panel"
      >
        ⚙️
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="glass-panel border border-dg-border w-full max-w-2xl mx-4 p-8 relative">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-dg-muted"
              aria-label="Close admin panel"
            >
              ✕
            </button>
            <h3 className="text-[20px] font-serif font-light mb-4">Admin control center</h3>
            {!authorized ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-[14px] text-dg-muted">Enter admin password to access stats.</p>
                <input
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b border-dg-border focus:border-dg-accent text-dg-fg py-2 outline-none"
                />
                <button
                  type="submit"
                  className="uppercase tracking-[0.4em] text-[11px] font-mono border border-dg-accent text-dg-accent px-4 py-2 rounded-full"
                >
                  Unlock
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 text-[13px] text-dg-muted">
                  <span>Solved: {solvedCount} / {puzzles.length}</span>
                  <span>Incorrect attempts: {attemptsTotal}</span>
                  <span>Hints used: {hintsTotal}</span>
                </div>
                <div className="space-y-4">
                  {puzzles.map((puzzle) => (
                    <div key={puzzle.id} className="border border-dg-border rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] uppercase tracking-[0.35em] text-dg-muted">Puzzle {puzzle.id}</span>
                        <span className="text-[12px] font-mono">Hint cost: {puzzle.penaltyMultiplierOnHint}×</span>
                      </div>
                      <p className="text-[16px] font-serif font-light">{puzzle.title}</p>
                      <p className="text-[13px] text-dg-muted">{puzzle.theme}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 border border-dg-border rounded-full text-[12px] uppercase tracking-[0.4em]">
                    Reset journey
                  </button>
                  <button className="px-4 py-2 border border-dg-border rounded-full text-[12px] uppercase tracking-[0.4em]">
                    Tweak penalties
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

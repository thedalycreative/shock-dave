import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { usePuzzleContext } from '../context/puzzle';

export function ProgressTrail() {
  const { puzzles, progress, percentage } = usePuzzleContext();
  const currentIndex = useMemo(() => puzzles.findIndex((p) => p.id === progress.currentPuzzle), [puzzles, progress]);

  return (
    <div className="glass-panel border-dg-border px-6 py-5 mb-8">
      <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.35em] text-dg-muted">
        <span>Puzzle {currentIndex + 1} / {puzzles.length}</span>
        <span>{percentage}% complete</span>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-dg-border overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-dg-accent to-white"
          style={{ width: `${percentage}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
}

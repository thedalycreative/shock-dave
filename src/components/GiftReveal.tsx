import { motion } from 'framer-motion';

interface GiftRevealProps {
  totalPuzzles: number;
  solvedCount: number;
}

export function GiftReveal({ totalPuzzles, solvedCount }: GiftRevealProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="glass-panel border border-dg-border p-10 space-y-6 text-center max-w-3xl mx-auto"
    >
      <p className="text-[12px] uppercase tracking-[0.4em] text-dg-muted">Gift revealed</p>
      <h2 className="text-[42px] font-serif font-light leading-snug">Sense of Self</h2>
      <p className="text-[18px] leading-relaxed text-dg-muted max-w-3xl mx-auto">
        {`All ${totalPuzzles} puzzles unlocked the password that opens a bespoke moment at Sense of Self in Collingwood. `}
        The slow reveal ends with a sultry steam, a salt kiss, and a glow that was waiting for you.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <a
          href="https://senseofself.com.au"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-full border border-dg-accent px-6 py-3 uppercase tracking-[0.4em] text-[11px] font-mono text-dg-accent hover:bg-dg-accent/10 transition-colors"
        >
          Visit Sense of Self
        </a>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-flex items-center justify-center rounded-full border border-dg-border px-6 py-3 uppercase tracking-[0.4em] text-[11px] font-mono text-dg-muted hover:border-dg-accent hover:text-dg-accent transition-colors"
        >
          Review the journey
        </button>
      </div>
      <p className="text-[12px] uppercase tracking-[0.3em] text-dg-muted">
        {solvedCount} / {totalPuzzles} puzzles solved
      </p>
    </motion.section>
  );
}

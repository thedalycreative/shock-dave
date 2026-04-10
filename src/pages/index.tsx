import { useState } from 'react';
import Head from 'next/head';
import { Layout } from '../components/Layout';
import { IntroSequence } from '../components/IntroSequence';
import { ProgressTrail } from '../components/ProgressTrail';
import { PuzzleCard } from '../components/PuzzleCard';
import { AdminModal } from '../components/AdminModal';
import { GiftReveal } from '../components/GiftReveal';
import { usePuzzleContext } from '../context/puzzle';
import { motion } from 'framer-motion';

export default function Home() {
  const { currentPuzzle, puzzles, progress } = usePuzzleContext();
  const [introComplete, setIntroComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const totalPuzzles = puzzles.length;
  const solvedCount = Object.keys(progress.solved).length;
  const journeyComplete = solvedCount >= totalPuzzles;

  const startButtonLabel = introComplete ? 'Start the journey' : 'Intro in progress…';

  return (
    <>
      <Head>
        <title>Perspective & Puzzle | Sense of Self Gift</title>
        <meta
          name="description"
          content="Premium interactive puzzle experience crafted as a slow reveal for Sense of Self."
        />
      </Head>
      <Layout>
        {!hasStarted ? (
          <section className="glass-panel border border-dg-border p-10 text-center space-y-8">
            <IntroSequence onComplete={() => setIntroComplete(true)} />
            <motion.button
              type="button"
              whileTap={{ scale: introComplete ? 0.95 : 1 }}
              onClick={() => introComplete && setHasStarted(true)}
              disabled={!introComplete}
              className={`uppercase tracking-[0.5em] text-[12px] font-mono border rounded-full px-10 py-3 transition-colors ${
                introComplete
                  ? 'border-dg-accent text-dg-accent hover:bg-dg-accent/10'
                  : 'border-dg-border text-dg-muted cursor-not-allowed'
              }`}
            >
              {startButtonLabel}
            </motion.button>
            <p className="text-[14px] text-dg-muted uppercase tracking-[0.4em]">
              25 puzzles • one slow reveal • gift at the end
            </p>
          </section>
        ) : journeyComplete ? (
          <GiftReveal totalPuzzles={totalPuzzles} solvedCount={solvedCount} />
        ) : (
          <>
            <ProgressTrail />
            <section className="glass-panel border border-dg-border p-10 space-y-6">
              <div className="space-y-2">
                <span className="text-[12px] uppercase tracking-[0.35em] text-dg-muted">
                  Puzzle {currentPuzzle.id} of {totalPuzzles}
                </span>
                <h2 className="text-[36px] font-serif font-light">{currentPuzzle.title}</h2>
                <p className="text-[14px] text-dg-muted uppercase tracking-[0.3em]">{currentPuzzle.theme}</p>
              </div>
              <p className="text-[22px] sm:text-[26px] leading-relaxed text-dg-fg">{currentPuzzle.question}</p>
              <div className="text-[12px] uppercase tracking-[0.4em] text-dg-muted">
                {currentPuzzle.relatedGift}
              </div>
            </section>
            <PuzzleCard />
          </>
        )}
      </Layout>
      <AdminModal />
    </>
  );
}

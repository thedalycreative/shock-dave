import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { Layout } from '../components/Layout';
import { IntroSequence, INTRO_DURATION_MS } from '../components/IntroSequence';
import { PuzzleCard } from '../components/PuzzleCard';
import { AdminModal } from '../components/AdminModal';
import { GiftReveal } from '../components/GiftReveal';
import { DaveRoast } from '../components/DaveRoast';
import { CooldownInterstitial } from '../components/CooldownInterstitial';
import { usePuzzleContext } from '../context/puzzle';
import { motion } from 'framer-motion';

export default function Home() {
  const { currentPuzzle, puzzles, progress } = usePuzzleContext();
  // Skip intro if Dave already has progress (returning from another device/browser)
  const hasPriorProgress = Object.keys(progress.solved).length > 0;
  const [introComplete, setIntroComplete] = useState(hasPriorProgress);
  const [hasStarted, setHasStarted] = useState(hasPriorProgress);
  const [adminOpen, setAdminOpen] = useState(false);
  const [introCountdown, setIntroCountdown] = useState(Math.ceil(INTRO_DURATION_MS / 1000));
  const totalPuzzles = puzzles.length;
  const solvedCount = Object.keys(progress.solved).length;
  const journeyComplete = solvedCount >= totalPuzzles;
  // Live timer for cooldown interstitial
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const cooldownActive = progress.cooldownExpiresAt > now;
  const penaltyActive = progress.penaltyExpiresAt > now;
  const cooldownRemaining = Math.max(0, Math.ceil((progress.cooldownExpiresAt - now) / 1000));

  const handleIntroComplete = useCallback(() => setIntroComplete(true), []);
  const handleDashboard = useCallback(() => {
    setHasStarted(false);
    setIntroComplete(false);
    setIntroCountdown(Math.ceil(INTRO_DURATION_MS / 1000));
  }, []);

  // Countdown syncs with IntroSequence mount lifecycle
  useEffect(() => {
    if (hasStarted || introComplete) return;
    const start = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, Math.ceil((INTRO_DURATION_MS - elapsed) / 1000));
      setIntroCountdown(remaining);
    }, 300);
    return () => clearInterval(tick);
  }, [hasStarted, introComplete]);

  return (
    <>
      <Head>
        <title>Dave vs. Puzzles</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#129513;</text></svg>" />
        <meta name="description" content="25 puzzles. One slow reveal. Zero faith in Dave." />
      </Head>
      <Layout
        onAdminOpen={() => setAdminOpen(true)}
        onDashboard={handleDashboard}
        showProgress={hasStarted && !journeyComplete}
      >
        {!hasStarted ? (
          <section className="glass-panel border border-dg-border rounded-2xl p-6 sm:p-8 text-center space-y-5">
            <IntroSequence onComplete={handleIntroComplete} />
            <motion.button
              type="button"
              whileTap={{ scale: introComplete ? 0.95 : 1 }}
              onClick={() => introComplete && setHasStarted(true)}
              disabled={!introComplete}
              className={`uppercase tracking-widest text-xs font-mono border rounded-full px-8 py-2.5 transition-all min-w-[160px] ${
                introComplete
                  ? 'border-dg-accent bg-dg-accent/15 text-dg-accent hover:bg-dg-accent/25'
                  : 'border-dg-border text-dg-muted cursor-not-allowed'
              }`}
            >
              {introComplete ? "Let's go, Dave" : `${introCountdown}s`}
            </motion.button>
            <p className="text-xs text-dg-muted/50 font-mono italic">
              25 puzzles &bull; one slow reveal &bull; zero faith in Dave
            </p>
          </section>
        ) : journeyComplete ? (
          <GiftReveal totalPuzzles={totalPuzzles} solvedCount={solvedCount} />
        ) : (
          <div className="space-y-3">
            {cooldownActive ? (
              <CooldownInterstitial
                puzzleId={currentPuzzle.id}
                remaining={cooldownRemaining}
                totalPuzzles={totalPuzzles}
                solvedCount={solvedCount}
              />
            ) : (
              <>
                {penaltyActive && (
                  <DaveRoast state="wrong" puzzleId={currentPuzzle.id} />
                )}
                <PuzzleCard />
              </>
            )}
          </div>
        )}
      </Layout>
      <AdminModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </>
  );
}

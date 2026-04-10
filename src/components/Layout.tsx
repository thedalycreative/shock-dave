import React from 'react';
import { motion } from 'framer-motion';
import { usePuzzleContext } from '../context/puzzle';
import { SteamOverlay } from './SteamOverlay';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  onAdminOpen: () => void;
  onDashboard: () => void;
  showProgress?: boolean;
}

export function Layout({ children, onAdminOpen, onDashboard, showProgress }: LayoutProps) {
  const { percentage, puzzles, progress } = usePuzzleContext();
  const solvedCount = Object.keys(progress.solved).length;

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500 bg-dg-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-dg-bg/60 via-transparent to-dg-bg/20 pointer-events-none" />
      <div className="grain-overlay" />
      <SteamOverlay />
      <Navbar onAdminOpen={onAdminOpen} onDashboard={onDashboard} showProgress={showProgress} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`relative z-10 max-w-3xl mx-auto w-full px-4 sm:px-6 pt-18 ${showProgress ? 'pb-20' : 'pb-8'}`}
        style={{ paddingTop: '4.5rem' }}
      >
        {children}
      </motion.div>

      {/* Sticky footer progress bar */}
      {showProgress && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="backdrop-blur-xl bg-dg-bg/80 border-t border-dg-border/40">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-dg-muted uppercase tracking-widest">
                  Progress
                </span>
                <span className="text-[10px] font-mono text-dg-accent">
                  {solvedCount} / {puzzles.length}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-dg-border/40 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-dg-accent/80 to-dg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

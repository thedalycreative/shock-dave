import { Moon, SunMedium, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../context/theme';
import { usePuzzleContext } from '../context/puzzle';

interface NavbarProps {
  onAdminOpen: () => void;
  onDashboard: () => void;
  showProgress?: boolean;
}

export function Navbar({ onAdminOpen, onDashboard, showProgress }: NavbarProps) {
  const { mode, toggle: toggleTheme } = useTheme();
  const { puzzles, progress } = usePuzzleContext();
  const solvedCount = Object.keys(progress.solved).length;
  const [logoHovered, setLogoHovered] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="backdrop-blur-xl bg-dg-bg/80 border-b border-dg-border/40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo + title */}
          <button
            type="button"
            onClick={onDashboard}
            className="flex items-center gap-2.5"
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
          >
            <motion.span
              className="text-lg inline-block"
              animate={{
                rotate: logoHovered ? [0, -10, 10, -5, 0] : 0,
                scale: logoHovered ? 1.15 : 1,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {logoHovered ? '\u{1F381}' : '\u{1F9E9}'}
            </motion.span>
            <motion.span
              className="text-sm font-serif"
              animate={{
                color: logoHovered ? 'rgb(var(--accent))' : 'rgb(var(--fg))',
              }}
              transition={{ duration: 0.25 }}
            >
              Dave vs. Puzzles
            </motion.span>
          </button>

          {/* Center: progress info (when playing) */}
          {showProgress && (
            <span className="text-xs font-mono text-dg-muted hidden sm:block">
              {solvedCount}/{puzzles.length}
            </span>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center text-dg-muted hover:text-dg-accent hover:bg-dg-accent/10 transition-all"
              aria-label="Toggle light/dark mode"
            >
              {mode === 'dark' ? <SunMedium className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onAdminOpen}
              className="w-9 h-9 rounded-full flex items-center justify-center text-dg-muted hover:text-dg-accent hover:bg-dg-accent/10 transition-all"
              aria-label="Open admin panel"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

import { Moon, SunMedium } from 'lucide-react';
import { useTheme } from '../context/theme';

export function ThemeToggle() {
  const { mode, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="glass-panel border border-dg-border px-4 py-2 rounded-full text-[12px] font-mono uppercase tracking-[0.4em] flex items-center gap-2 hover:border-dg-accent transition-colors"
      aria-label="Switch theme"
    >
      {mode === 'dark' ? <SunMedium className="w-4 h-4 text-dg-accent" /> : <Moon className="w-4 h-4 text-dg-accent" />}
      {mode === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}

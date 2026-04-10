import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/theme';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { mode } = useTheme();

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${mode === 'light' ? 'bg-[#f5f3f0]' : 'bg-dg-bg'}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/30 pointer-events-none" />
      <div className="grain-overlay" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-5xl mx-auto w-full px-4 py-14"
      >
        {children}
      </motion.div>
    </div>
  );
}

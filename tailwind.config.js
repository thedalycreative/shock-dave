/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dg-bg': 'rgb(var(--bg) / <alpha-value>)',
        'dg-bg2': 'rgb(var(--bg2) / <alpha-value>)',
        'dg-fg': 'rgb(var(--fg) / <alpha-value>)',
        'dg-accent': 'rgb(var(--accent) / <alpha-value>)',
        'dg-muted': 'rgb(var(--muted) / <alpha-value>)',
        'dg-border': 'rgb(var(--border) / <alpha-value>)',
        'dg-red': 'rgb(var(--red) / <alpha-value>)',
        'dg-green': 'rgb(var(--green) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 1s ease forwards',
        'pulse-slow': 'pulse 2.2s ease infinite',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dg-bg': '#0d0b08',
        'dg-bg2': '#141109',
        'dg-fg': '#ede8dd',
        'dg-accent': '#c8a45a',
        'dg-adim': 'rgba(200,164,90,0.12)',
        'dg-muted': '#5a5347',
        'dg-border': '#2a2519',
        'dg-red': '#c84848',
        'dg-green': '#5a9e6a',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['Noto Serif', 'serif'],
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

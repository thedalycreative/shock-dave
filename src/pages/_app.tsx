import type { AppProps } from 'next/app';
import { ThemeProvider } from '../context/theme';
import { PuzzleProvider } from '../context/puzzle';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <PuzzleProvider>
        <Component {...pageProps} />
      </PuzzleProvider>
    </ThemeProvider>
  );
}

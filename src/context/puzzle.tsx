import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { PuzzleConfig, PuzzleId, SessionProgress } from '../types/puzzle';
import samplePuzzles from '../data/samplePuzzles';
import {
  sessionsCollection,
  generateSessionToken,
  validateAnswer,
  requestHint as requestHintCallable,
} from '../lib/firebase';
import {
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

type PuzzleActions = {
  submitAnswer: (id: PuzzleId, attempt: string) => Promise<boolean>;
  requestHint: (id: PuzzleId) => Promise<void>;
};

type AdminActions = {
  setPuzzleStatus: (id: PuzzleId, status: 'solved' | 'active' | 'locked') => void;
  updatePuzzleTiming: (id: PuzzleId, timing: { cooldownMin?: number; penaltyBase?: number; penaltyIncrement?: number }) => void;
  togglePuzzle: (id: PuzzleId, enabled: boolean) => void;
  resetJourney: () => void;
  saveAll: () => void;
};

interface PuzzleContextValue {
  puzzles: PuzzleConfig[];
  currentPuzzle: PuzzleConfig;
  progress: SessionProgress;
  percentage: number;
  actions: PuzzleActions;
  adminActions: AdminActions;
  disabledPuzzles: Set<PuzzleId>;
  puzzleTimingOverrides: Record<PuzzleId, { cooldownMin?: number; penaltyBase?: number; penaltyIncrement?: number }>;
}

const PuzzleContext = createContext<PuzzleContextValue | undefined>(undefined);

const initialProgress: SessionProgress = {
  sessionId: 'guest',
  currentPuzzle: samplePuzzles[0].id,
  solved: {},
  incorrectAttempts: {},
  hintsUsed: {},
  penaltyExpiresAt: 0,
  cooldownExpiresAt: 0,
  sessionStart: Date.now(),
  totalElapsedMs: 0,
  lastUpdated: Date.now(),
};

export function PuzzleProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(initialProgress);
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window === 'undefined') return 'guest';
    return generateSessionToken();
  });
  const isFirebaseEnabled = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

  const order = samplePuzzles.map((p) => p.id);
  const currentIndex = Math.max(0, order.indexOf(progress.currentPuzzle));
  const currentPuzzle = samplePuzzles[currentIndex] ?? samplePuzzles[0];
  const percentage = Math.min(
    100,
    Math.round(((currentIndex + 1) / samplePuzzles.length) * 100)
  );

  const persistSession = async (patch: Partial<SessionProgress>) => {
    if (!isFirebaseEnabled || typeof window === 'undefined') return;
    try {
      const sessionDoc = doc(sessionsCollection, sessionId);
      await updateDoc(sessionDoc, {
        ...patch,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.warn('Persist session failed', error);
    }
  };

  useEffect(() => {
    if (!isFirebaseEnabled || typeof window === 'undefined') return;
    const sessionDoc = doc(sessionsCollection, sessionId);
    const unsub = onSnapshot(sessionDoc, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() as Partial<SessionProgress>;
      setProgress((prev) => ({
        ...prev,
        ...data,
      }));
    }, (error) => {
      console.warn('Snapshot listener failed, using local state', error);
    });
    return () => unsub();
  }, [isFirebaseEnabled, sessionId]);

  const ensureSessionDoc = async () => {
    if (!isFirebaseEnabled || typeof window === 'undefined') return;
    try {
      const sessionDoc = doc(sessionsCollection, sessionId);
      const snapshot = await getDoc(sessionDoc);
      if (!snapshot.exists()) {
        await setDoc(sessionDoc, {
          ...initialProgress,
          sessionId,
          sessionStart: Date.now(),
          lastUpdated: Date.now(),
        });
      }
    } catch (error) {
      console.warn('Firebase session init failed, using local state', error);
    }
  };

  useEffect(() => {
    ensureSessionDoc();
  }, [sessionId, isFirebaseEnabled]);

  const applySolved = (id: PuzzleId, timestamp: number) => {
    setProgress((prev) => {
      const solved = { ...prev.solved, [id]: timestamp };
      const nextIndex = Math.min(samplePuzzles.length - 1, order.indexOf(id) + 1);
      const nextPuzzle = order[nextIndex];
      const timing = getEffectiveTiming(currentPuzzle);
      return {
        ...prev,
        solved,
        currentPuzzle: nextPuzzle ?? prev.currentPuzzle,
        penaltyExpiresAt: 0,
        cooldownExpiresAt: timestamp + timing.cooldownMin * 1000,
        lastUpdated: timestamp,
      };
    });
  };

  const applyAttempt = (id: PuzzleId, timestamp: number) => {
    setProgress((prev) => {
      const attempts = (prev.incorrectAttempts[id] ?? 0) + 1;
      const puzzle = samplePuzzles.find((p) => p.id === id) ?? currentPuzzle;
      const timing = getEffectiveTiming(puzzle);
      const penalty =
        Math.max(prev.penaltyExpiresAt, timestamp) + timing.penaltyIncrement * 1000;
      return {
        ...prev,
        incorrectAttempts: { ...prev.incorrectAttempts, [id]: attempts },
        penaltyExpiresAt: penalty,
        lastUpdated: timestamp,
      };
    });
  };

  const applyHint = (id: PuzzleId, timestamp: number) => {
    setProgress((prev) => {
      const used = (prev.hintsUsed[id] ?? 0) + 1;
      const puzzle = samplePuzzles.find((p) => p.id === id) ?? currentPuzzle;
      const timing = getEffectiveTiming(puzzle);
      const penalty =
        Math.max(prev.penaltyExpiresAt, timestamp) +
        timing.penaltyBase * timing.penaltyMultiplierOnHint * 1000;
      return {
        ...prev,
        hintsUsed: { ...prev.hintsUsed, [id]: used },
        penaltyExpiresAt: penalty,
        lastUpdated: timestamp,
      };
    });
  };

  const submitAnswer = async (id: PuzzleId, attempt: string) => {
    const timestamp = Date.now();
    if (!isFirebaseEnabled) {
      const puzzle = samplePuzzles.find((p) => p.id === id);
      if (!puzzle) return false;
      const timing = getEffectiveTiming(puzzle);
      const normalized = attempt.toLowerCase().trim();
      if (puzzle.demoAnswer && normalized === puzzle.demoAnswer.toLowerCase()) {
        applySolved(id, timestamp);
        await persistSession({
          solved: { ...progress.solved, [id]: timestamp },
          currentPuzzle: order[Math.min(order.length - 1, order.indexOf(id) + 1)],
          penaltyExpiresAt: 0,
          cooldownExpiresAt: timestamp + timing.cooldownMin * 1000,
        });
        return true;
      }
      applyAttempt(id, timestamp);
      await persistSession({
        incorrectAttempts: {
          ...progress.incorrectAttempts,
          [id]: (progress.incorrectAttempts[id] ?? 0) + 1,
        },
        penaltyExpiresAt: Math.max(progress.penaltyExpiresAt, timestamp) + timing.penaltyIncrement * 1000,
      });
      return false;
    }

    try {
      const response = await validateAnswer({
        sessionId,
        puzzleId: id,
        attempt,
      });
      const data = response.data as {
        success: boolean;
        penaltyExpiresAt: number;
        cooldownExpiresAt: number;
        nextPuzzleId: PuzzleId;
        incorrectAttempts: number;
        hintsUsed: number;
        solvedAt: number;
      };
      if (data.success) {
        applySolved(id, data.solvedAt ?? timestamp);
        await persistSession({
          solved: { ...progress.solved, [id]: data.solvedAt ?? timestamp },
          currentPuzzle: data.nextPuzzleId,
          penaltyExpiresAt: data.penaltyExpiresAt,
          cooldownExpiresAt: data.cooldownExpiresAt,
        });
        return true;
      }
      applyAttempt(id, timestamp);
      await persistSession({
        incorrectAttempts: {
          ...progress.incorrectAttempts,
          [id]: data.incorrectAttempts,
        },
        penaltyExpiresAt: data.penaltyExpiresAt,
      });
      return false;
    } catch (error) {
      console.warn('Validation failed, falling back to local check', error);
      // Fallback to local validation when Firebase callable fails
      const puzzle = samplePuzzles.find((p) => p.id === id);
      if (!puzzle) return false;
      const timing = getEffectiveTiming(puzzle);
      const normalized = attempt.toLowerCase().trim();
      if (puzzle.demoAnswer && normalized === puzzle.demoAnswer.toLowerCase()) {
        applySolved(id, timestamp);
        await persistSession({
          solved: { ...progress.solved, [id]: timestamp },
          currentPuzzle: order[Math.min(order.length - 1, order.indexOf(id) + 1)],
          penaltyExpiresAt: 0,
          cooldownExpiresAt: timestamp + timing.cooldownMin * 1000,
        });
        return true;
      }
      applyAttempt(id, timestamp);
      await persistSession({
        incorrectAttempts: {
          ...progress.incorrectAttempts,
          [id]: (progress.incorrectAttempts[id] ?? 0) + 1,
        },
        penaltyExpiresAt: Math.max(progress.penaltyExpiresAt, timestamp) + timing.penaltyIncrement * 1000,
      });
      return false;
    }
  };

  const requestHint = async (id: PuzzleId) => {
    const timestamp = Date.now();
    if (!isFirebaseEnabled) {
      const timing = getEffectiveTiming(currentPuzzle);
      applyHint(id, timestamp);
      await persistSession({
        hintsUsed: {
          ...progress.hintsUsed,
          [id]: (progress.hintsUsed[id] ?? 0) + 1,
        },
        penaltyExpiresAt:
          Math.max(progress.penaltyExpiresAt, timestamp) +
          timing.penaltyBase * timing.penaltyMultiplierOnHint * 1000,
      });
      return;
    }

    try {
      const response = await requestHintCallable({ sessionId, puzzleId: id });
      const data = response.data as {
        hint: string;
        penaltyExpiresAt: number;
        hintsUsed: number;
      };
      applyHint(id, timestamp);
      await persistSession({
        hintsUsed: {
          ...progress.hintsUsed,
          [id]: data.hintsUsed,
        },
        penaltyExpiresAt: data.penaltyExpiresAt,
      });
    } catch (error) {
      console.warn('Hint request failed, falling back to local', error);
      // Fallback to local hint when Firebase callable fails
      const timing = getEffectiveTiming(currentPuzzle);
      applyHint(id, timestamp);
      await persistSession({
        hintsUsed: {
          ...progress.hintsUsed,
          [id]: (progress.hintsUsed[id] ?? 0) + 1,
        },
        penaltyExpiresAt:
          Math.max(progress.penaltyExpiresAt, timestamp) +
          timing.penaltyBase * timing.penaltyMultiplierOnHint * 1000,
      });
    }
  };

  const [disabledPuzzles, setDisabledPuzzles] = useState<Set<PuzzleId>>(new Set());
  const [puzzleTimingOverrides, setPuzzleTimingOverrides] = useState<Record<PuzzleId, { cooldownMin?: number; penaltyBase?: number; penaltyIncrement?: number }>>({});

  /** Returns effective timing for a puzzle, with admin overrides applied */
  const getEffectiveTiming = (puzzle: PuzzleConfig) => {
    const o = puzzleTimingOverrides[puzzle.id] ?? {};
    return {
      penaltyBase: o.penaltyBase ?? puzzle.penaltyBase,
      penaltyIncrement: o.penaltyIncrement ?? puzzle.penaltyIncrement,
      cooldownMin: o.cooldownMin ?? puzzle.cooldownMin,
      penaltyMultiplierOnHint: puzzle.penaltyMultiplierOnHint,
    };
  };

  const adminActions: AdminActions = useMemo(() => ({
    setPuzzleStatus: (id: PuzzleId, status: 'solved' | 'active' | 'locked') => {
      setProgress((prev) => {
        const next = { ...prev };
        if (status === 'solved') {
          next.solved = { ...prev.solved, [id]: Date.now() };
        } else if (status === 'active') {
          const { [id]: _, ...rest } = prev.solved;
          next.solved = rest;
          next.currentPuzzle = id;
          next.penaltyExpiresAt = 0;
          next.cooldownExpiresAt = 0;
        } else if (status === 'locked') {
          const { [id]: _, ...rest } = prev.solved;
          next.solved = rest;
        }
        next.lastUpdated = Date.now();
        return next;
      });
    },
    updatePuzzleTiming: (id: PuzzleId, timing: { cooldownMin?: number; penaltyBase?: number; penaltyIncrement?: number }) => {
      setPuzzleTimingOverrides((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? {}), ...timing },
      }));
    },
    togglePuzzle: (id: PuzzleId, enabled: boolean) => {
      setDisabledPuzzles((prev) => {
        const next = new Set(prev);
        if (enabled) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    resetJourney: () => {
      setProgress({ ...initialProgress, sessionId, sessionStart: Date.now(), lastUpdated: Date.now() });
      persistSession({ ...initialProgress, sessionId, sessionStart: Date.now(), lastUpdated: Date.now() });
    },
    saveAll: () => {
      persistSession({ ...progress, lastUpdated: Date.now() });
    },
  }), [sessionId]);

  // Recalculate active cooldown when admin changes timing overrides
  useEffect(() => {
    setProgress((prev) => {
      const now = Date.now();
      if (prev.cooldownExpiresAt <= now) return prev;
      // Find which puzzle was just solved to recalculate its cooldown
      const currentIdx = order.indexOf(prev.currentPuzzle);
      const prevPuzzleId = currentIdx > 0 ? order[currentIdx - 1] : null;
      if (!prevPuzzleId || !prev.solved[prevPuzzleId]) return prev;
      const solvedAt = prev.solved[prevPuzzleId];
      const prevPuzzle = samplePuzzles.find((p) => p.id === prevPuzzleId);
      if (!prevPuzzle) return prev;
      const timing = getEffectiveTiming(prevPuzzle);
      const newExpiry = solvedAt + timing.cooldownMin * 1000;
      if (newExpiry === prev.cooldownExpiresAt) return prev;
      return { ...prev, cooldownExpiresAt: newExpiry };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleTimingOverrides]);

  const value = useMemo(
    () => ({
      puzzles: samplePuzzles,
      currentPuzzle,
      progress,
      percentage,
      actions: { submitAnswer, requestHint },
      adminActions,
      disabledPuzzles,
      puzzleTimingOverrides,
    }),
    [currentPuzzle, progress, percentage, adminActions, disabledPuzzles, puzzleTimingOverrides]
  );

  return <PuzzleContext.Provider value={value}>{children}</PuzzleContext.Provider>;
}

export function usePuzzleContext() {
  const context = useContext(PuzzleContext);
  if (!context) {
    throw new Error('usePuzzleContext must be used within PuzzleProvider');
  }
  return context;
}

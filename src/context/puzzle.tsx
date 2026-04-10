import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

const LOCAL_STORAGE_KEY = 'dave-puzzle-progress';

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

/** Read cached progress from localStorage for instant hydration */
function loadLocalProgress(): SessionProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionProgress;
    // Sanity check — must have a currentPuzzle field
    if (parsed && parsed.currentPuzzle) return parsed;
  } catch { /* corrupt data — ignore */ }
  return null;
}

/** Cache progress to localStorage */
function saveLocalProgress(progress: SessionProgress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
  } catch { /* quota exceeded — ignore */ }
}

export function PuzzleProvider({ children }: { children: React.ReactNode }) {
  // Hydrate immediately from localStorage, then Firestore overrides
  const [progress, setProgress] = useState<SessionProgress>(() => {
    const cached = loadLocalProgress();
    return cached ?? initialProgress;
  });
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return 'guest';
    return generateSessionToken();
  });
  const isFirebaseEnabled = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  // Track whether Firestore has done its initial hydration
  const firestoreHydrated = useRef(false);

  const order = samplePuzzles.map((p) => p.id);
  const currentIndex = Math.max(0, order.indexOf(progress.currentPuzzle));
  const currentPuzzle = samplePuzzles[currentIndex] ?? samplePuzzles[0];
  const percentage = Math.min(
    100,
    Math.round(((currentIndex + 1) / samplePuzzles.length) * 100)
  );

  // Cache to localStorage on every progress change
  useEffect(() => {
    saveLocalProgress(progress);
  }, [progress]);

  /** Persist full progress to Firestore (merge so partial fields don't clobber) */
  const persistToFirestore = useCallback(async (data: SessionProgress) => {
    if (!isFirebaseEnabled || typeof window === 'undefined') return;
    try {
      const sessionDoc = doc(sessionsCollection, sessionId);
      await setDoc(sessionDoc, { ...data, lastUpdated: Date.now() }, { merge: true });
    } catch (error) {
      console.warn('Firestore persist failed', error);
    }
  }, [isFirebaseEnabled, sessionId]);

  // Listen for Firestore changes (handles cross-device sync + initial hydration)
  useEffect(() => {
    if (!isFirebaseEnabled || typeof window === 'undefined') return;
    const sessionDoc = doc(sessionsCollection, sessionId);

    const unsub = onSnapshot(sessionDoc, (snapshot) => {
      if (!snapshot.exists()) {
        // Doc doesn't exist yet — create it from local state (first device ever)
        if (!firestoreHydrated.current) {
          firestoreHydrated.current = true;
          const cached = loadLocalProgress();
          const seed = cached ?? initialProgress;
          setDoc(sessionDoc, { ...seed, sessionId, lastUpdated: Date.now() }, { merge: true }).catch(() => {});
        }
        return;
      }
      const data = snapshot.data() as SessionProgress;
      setProgress((prev) => {
        if (!firestoreHydrated.current) {
          firestoreHydrated.current = true;
          // First hydration: whoever has MORE progress wins
          const firestoreSolved = Object.keys(data.solved ?? {}).length;
          const localSolved = Object.keys(prev.solved ?? {}).length;
          if (firestoreSolved >= localSolved) {
            // Firestore has equal or more progress — use it
            return { ...prev, ...data };
          }
          // Local has more progress — push local to Firestore
          persistToFirestore(prev);
          return prev;
        }
        // Subsequent updates: Firestore is source of truth
        return { ...prev, ...data };
      });
    }, (error) => {
      console.warn('Snapshot listener failed, using local state', error);
    });
    return () => unsub();
  }, [isFirebaseEnabled, sessionId, persistToFirestore]);

  /** Update progress state AND persist to Firestore in one step */
  const updateAndPersist = useCallback((updater: (prev: SessionProgress) => SessionProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      // Fire-and-forget persist to Firestore
      persistToFirestore(next);
      return next;
    });
  }, [persistToFirestore]);

  const applySolved = (id: PuzzleId, timestamp: number) => {
    updateAndPersist((prev) => {
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
    updateAndPersist((prev) => {
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
    updateAndPersist((prev) => {
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
    // Try Firebase Cloud Function first, fall back to local validation
    if (isFirebaseEnabled) {
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
          return true;
        }
        applyAttempt(id, timestamp);
        return false;
      } catch (error) {
        console.warn('Cloud Function failed, falling back to local validation', error);
      }
    }

    // Local validation (used when Firebase is disabled or Cloud Function fails)
    const puzzle = samplePuzzles.find((p) => p.id === id);
    if (!puzzle) return false;
    const normalized = attempt.toLowerCase().trim();
    if (puzzle.demoAnswer && normalized === puzzle.demoAnswer.toLowerCase()) {
      applySolved(id, timestamp);
      return true;
    }
    applyAttempt(id, timestamp);
    return false;
  };

  const requestHint = async (id: PuzzleId) => {
    const timestamp = Date.now();
    // Try Firebase Cloud Function first
    if (isFirebaseEnabled) {
      try {
        const response = await requestHintCallable({ sessionId, puzzleId: id });
        const data = response.data as {
          hint: string;
          penaltyExpiresAt: number;
          hintsUsed: number;
        };
        applyHint(id, timestamp);
        return;
      } catch (error) {
        console.warn('Hint Cloud Function failed, falling back to local', error);
      }
    }

    // Local fallback
    applyHint(id, timestamp);
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
      updateAndPersist((prev) => {
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
      const fresh = { ...initialProgress, sessionId, sessionStart: Date.now(), lastUpdated: Date.now() };
      setProgress(fresh);
      persistToFirestore(fresh);
      // Clear localStorage too
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    },
    saveAll: () => {
      setProgress((prev) => {
        const updated = { ...prev, lastUpdated: Date.now() };
        persistToFirestore(updated);
        return updated;
      });
    },
  }), [sessionId, updateAndPersist, persistToFirestore]);

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

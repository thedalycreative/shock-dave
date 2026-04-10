# Puzzle Journey Architecture (Next.js + Firebase)

## 1. Pages & Layout

- `/pages/index.tsx`: single-page experience that hosts the “Modern Artifact” layout, handles intro animation, and decides which component to show (puzzle card, reveal, admin modal).
- `/pages/_app.tsx`: applies Tailwind, fonts, and provides `ThemeProvider` + `PuzzleContext` to share progress data throughout the tree.
- `/components/columns/Layout.tsx`: glassy container with background grain overlay, toggles dark/light mode, and manages focus trap when intro is skipped.
- `/components/IntroSequence.tsx`: Framer Motion-based sequence that plays once per session and unlocks the ready state.
- `/components/ProgressTrail.tsx`: visual timeline showing `currentPuzzle / total` plus percent complete (line with animated gradient fill).
- `/components/PuzzleCard.tsx`: renders question, description, hint toggles, and the input/controls for each type (text/choice/slider/selection/number). Uses `SubmitControl`, `HintPanel`, `PenaltyStatus`, etc.
- `/components/PuzzleInputs/*`: reusable input variants (TextInput, ChoiceGrid, RangeSlider, SlotSelector) with accessible keyboard handling.
- `/components/AdminModal.tsx`: sticky button opens password-protected modal with tabs (Progress Review, Answers, Settings, Reset). Uses `useAdminContext` to fetch analytics data via Firebase.

## 2. State & Context

- `PuzzleContext` (React Context/Zustand):
  * `puzzles: PuzzleConfig[]`
  * `session: SessionProgress`
  * `currentPuzzle: PuzzleConfig`
  * `penaltyState: PenaltyStatus`
  * `hintsUsed: Record<PuzzleId, number>`
  * actions: `submitAnswer`, `requestHint`, `advancePuzzle`, `restartJourney`.
  * Syncs with Firestore on mount and on every action (throttled).

- `useTimer` hook to expose elapsed time, cooldown countdown, and penalty countdown (derived from timestamps stored in Firestore).

## 3. Firebase Integration

- `lib/firebase.ts`
  * initialize Firebase app with config from `.env.local`.
  * export Firestore collection helpers: `sessions`, `puzzles`, `adminSettings`, `attemptLogs`.
  * Provide Cloud Function call for `validatePassword(sessionId, puzzleId, answer)` to keep answers server-side.
  * Provide `getSessionToken()` that either uses Firebase Auth anonymous user or stored UUID.

- Firestore schema:
  ```
  sessions/{sessionId} {
    currentPuzzle: PuzzleId;
    solved: Record<PuzzleId, number>; // unix ms
    hintsUsed: Record<PuzzleId, number>;
    incorrectAttempts: Record<PuzzleId, number>;
    penaltyExpiresAt: number;
    cooldownExpiresAt: number;
    sessionStart: number;
    totalElapsedMs: number;
  }
  ```

## 4. Penalty, Hint & Cooldown Logic

- `penaltyBase` default 30 seconds; each wrong submission adds `penaltyIncrement`.
- Submit button disabled while `now < penaltyExpiresAt`.
- Hints double the current penalty and increment `hintsUsed[puzzleId]`.
- After correct answer, set `cooldownExpiresAt = now + puzzle.cooldownMin` and only allow `currentPuzzle` to advance once cooldown passes.
- Provide UI badges for `Penalties: Xs`, `Hints used: Y / max`, `Wrong tries: Z`, and `Time on puzzle: mm:ss`.

## 5. Admin Controls

- Admin modal tabs:
  * **Progress**: table showing time spent, hints used, wrong attempts per puzzle + global totals.
  * **Answers**: list (hidden behind toggle) with puzzle IDs and their hashed passwords (admin-only view).
  * **Settings**: inputs to change `penaltyBase`, `penaltyIncrement`, `hintMultiplier`, `cooldownMin`.
  * **Action**: buttons to lock/unlock puzzles, reset session, or force reveal gift.

- Admin authentication uses hashed password stored via environment variable; validation occurs in Cloud Function before granting `adminSession` token (stored in `sessionStorage`).

## 6. Animations & Visual Style

- All cards use glassmorphism (`backdrop-filter: blur(18px); border: 1px solid rgba(255,255,255,0.12);`).
- Grain overlay sits on `<body>` with low opacity (2-3%) using CSS `::after`.
- Use Framer Motion for:
  * Sequence entrance (intro lines fading + sliding).
  * Submit button states (glow/pulse when active, greyed-out on penalty).
  * Puzzle reveal transitions (card fades in/out as you unlock new puzzle).
  * Admin modal and hint reveals with staggered animations.

## 7. Accessiblity & Keyboard Support

- All inputs reachable via Tab; text input uses `aria-label` describing puzzle.
- Use `role="progressbar"` on timeline with `aria-valuenow`.
- Implement `SkipIntro` button to mark intro as seen and jump straight to ready state.
- Provide `FocusRing` utility for consistent focus styling.

## 8. Deployment & Environment

- `.env.local` includes:
  * `NEXT_PUBLIC_FIREBASE_API_KEY`, etc.
  * `FIREBASE_APP_ID`, `FIREBASE_ADMIN_PASSWORD_HASH`
  * `PUZZLE_TOTAL = 18`
  * `PENALTY_BASE = 30`, `PENALTY_INCREMENT = 5`, `HINT_MULTIPLIER = 2`
  * `COOLDOWN_BASE = 1800`

- Deploy on Vercel or Cloudflare Pages (Next.js) with Firebase backend; use CI to build/test.

Next I'll craft the TypeScript types and Firebase helper module so they can be referenced when building the UI. Let me know if you want those files now before I start building components. 

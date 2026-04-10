# ShockDave: Unlock the Gift

A premium, interactive multi-day puzzle game built as a gift-delivery mechanism for Dave. Solve 25 puzzles to unlock a spa experience at Sense of Self in Collingwood, Melbourne.

---

## How It Works

1. Dave lands on a personalized intro sequence with humor and animations
2. Progresses through 25 interactive puzzles (multiple choice, counters, sliders, dropdowns, image-tap)
3. Each puzzle has cooldown timers between questions and penalty lockouts for wrong answers
4. Confetti fires on correct answers, roasts appear between questions
5. After all 25 puzzles, a dramatic gift reveal sequence plays

---

## Tech Stack

- **Framework**: Next.js 14 (Pages Router) with TypeScript
- **Styling**: Tailwind CSS 3.4 with custom design tokens (`dg-bg`, `dg-fg`, `dg-accent`, etc.)
- **Fonts**: DM Serif Display (headings) + Inter (body/mono)
- **Animations**: Framer Motion for transitions, CSS keyframes for steam/grain effects, Canvas API for confetti
- **State**: React Context API (`PuzzleProvider`) with Firebase Firestore sync
- **Persistence**: Firebase Firestore with `onSnapshot` real-time listener. Fixed session ID (`dave-main-game`) syncs across browsers/devices. Local fallback if Firebase is unavailable.
- **Cloud Functions**: `validateAnswer`, `requestHint`, `fetchAdminMetrics`

---

## Key Components

| Component | Purpose |
|-----------|---------|
| `IntroSequence` | Personalized 8-line intro with staggered blur-in animations |
| `PuzzleCard` | Renders all interactive input types + timer/status display |
| `DaveRoast` | Context-aware roasts for correct/wrong/waiting/hint states |
| `GiftReveal` | Two-phase dramatic reveal with golden glow gift card |
| `Confetti` | Canvas-based multi-burst particle system (6 colors, 3 shapes) |
| `SteamOverlay` | 7 ambient CSS-animated golden steam wisps |
| `Navbar` | Top bar with title, light/dark toggle, admin access |
| `AdminModal` | Full admin panel with master timing, per-puzzle controls, previews |
| `ProgressTrail` | Visual progress bar showing completion percentage |
| `Layout` | Main wrapper with grain overlay, gradient, steam |

---

## Admin Panel

Access via the gear icon in the navbar (password: `admin`).

- **Stats + ETA**: Shows solved count, incorrect attempts, hints used, and earliest possible finish time
- **Master timing**: Set cooldown, penalty, and increment for all puzzles at once
- **Per-puzzle controls**: Status (solved/active/locked), timing overrides, enable/disable toggle, answer display
- **Preview**: Preview intro and outro sequences
- **Actions**: Reset journey, save changes

---

## Puzzle Types

- `choice` — Multiple choice grid (most puzzles)
- `dropdown` — Select from dropdown options
- `counter` — Increment/decrement to a target number
- `dual-slider` — Set two slider values
- `image-tap` — Tap zones on an image (currently choice fallback)

---

## Styling Tokens (`tailwind.config.js`)

| Token | Value | Use |
|-------|-------|-----|
| `dg-bg` | `#0d0b08` | Primary dark background |
| `dg-fg` | `#ede8dd` | Cream text |
| `dg-accent` | `#c8a45a` | Gold/bronze accent |
| `dg-muted` | `#5a5347` | Subdued text |
| `dg-border` | `#2a2519` | Border color |
| `dg-red` | `#c84848` | Error/penalty |
| `dg-green` | `#5a9e6a` | Success |

Light mode overrides are in `globals.css` under `body[data-theme='light']`.

---

## Environment Variables

Set in `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Development

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # Production build
```

### Firebase Functions

```bash
npm --prefix functions run build
firebase deploy --only functions,firestore
```

---

*Built with intention by Tim.*

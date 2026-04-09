# ShockDave: Unlock the Gift

**ShockDave** is a premium, interactive multi-day puzzle application designed as a gift-delivery mechanism. It combines progressive narrative disclosure with rigorous logic puzzles and real-time administrative control.

---

## 🎯 Core Principles

1.  **Premium Aesthetics**: The application uses a "Modern Artifact" design language. It prioritizes high-contrast typography (Cormorant Garamond), a muted "monolithic" color palette, and subtle micro-animations (grain, steam wipes, confetti) to create a sense of mystery and value.
2.  **Progressive Disclosure**: Content is locked behind both logic (puzzles) and round time (intervals) of 15 mins between rounds. This ensures the "gift" is a journey rather than a single interaction.
3.  **Real-Time Persistence**: Every action is synced to a cloud backend. The state is "live"—if the admin changes a setting or skips a clue, the user's screen updates instantly without a refresh.
4.  **Administrative Sovereignty**: A hidden admin panel allows total control over the player's experience, including the ability to bypass time-locks, correct mistakes, or reset the entire session.

---

## 🛠 Technical Stack & Methods

### **Frontend Architecture**
-   **Framework**: [React](https://reactjs.org/) (Functional Components + Hooks).
-   **Build Tool**: [Vite](https://vitejs.dev/) for ultra-fast development and optimized production bundles.
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for a utility-first, responsive design system.
-   **Animations**: [Framer Motion](https://www.framer.com/motion/) handling orchestrations, `AnimatePresence` for screen transitions, and spring-based interactions.

### **State & Persistence**
-   **Database**: [Firebase Firestore](https://firebase.google.com/products/firestore).
-   **Sync Method**: `onSnapshot` listener in `App.jsx` creates a real-time bridge between the cloud state and the local React state.
-   **Reconciliation**: A custom `reconcile` logic determines the current UI screen by evaluating `startTs`, `solved` arrays, `disabled` flags, and server-side `lockout` timestamps.

### **Key Components**
-   **`SteamOverlay`**: A custom particle system and blur-wipe used to mask screen transitions, creating a "vaporous" feel.
-   **`AdminPanel`**: A Material-inspired modal with a separate design language (light mode) for clarity and functionality.
-   **`ConfettiCannon`**: Optimized HTML5 Canvas-based particle emitter for the final reward sequence.

---

## 🗺 Reference Points for Future Updates

### **State Schema (`sessions/main-game`)**
-   `startTs` (Number|null): The Unix timestamp when the user entered the correct site password.
-   `solved` (Array<Number>): IDs of puzzles successfully completed.
-   `disabled` (Array<Number>): IDs of puzzles skipped by the admin.
-   `lockoutUntil` (Number): Unix timestamp when the current wrong-answer penalty expires.
-   `lockoutClueId` (Number): The clue ID that triggered the current lockout.
-   `intervalMs` (Number): Milliseconds between clue unlocks (Default: 60,000 / 1min).
-   `lockoutMs` (Number): Penalty duration for wrong answers (Default: 10,000 / 10s).

### **Data Modification**
-   All puzzle content (text, choices, images, logic) is stored in `src/constants.js`.
-   To change the site entrance password, update `BASE.sitePassword` in `constants.js`.

### **Styling Tokens (`tailwind.config.js`)**
-   `dg-bg`: The primary dark background (#0d0b08).
-   `dg-accent`: The signature gold/bronze color (#c8a45a).
-   `dg-fg`: The soft cream text color (#ede8dd).

---

## 🚀 Deployment

1.  **Firebase**: Connect your project in `src/lib/firebase.js` using `.env` variables.
2.  **Vercel**: Connect the GitHub repo; Ensure `VITE_` prefixed environment variables are added to the Vercel dashboard.

---

*Built with intention by Tim.*

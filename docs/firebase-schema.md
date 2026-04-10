# Firebase schema & Cloud Function contracts

## Collections

- `sessions/{sessionId}`
  - `currentPuzzle: string` (PuzzleId)
  - `solved: Record<PuzzleId, number>` (unix millis when solved)
  - `incorrectAttempts: Record<PuzzleId, number>`
  - `hintsUsed: Record<PuzzleId, number>`
  - `penaltyExpiresAt: number` (timestamp until submit locked)
  - `cooldownExpiresAt: number`
  - `sessionStart: number`
  - `totalElapsedMs: number`
  - `lastUpdated: number`

- `config/puzzles` (optional)
  - array of puzzle metadata (type, penaltyBase, cooldownMin, hashed answer)

- `config/adminSettings`
  - `penaltyIncrement`, `hintMultiplier`, `cooldownBase`, `rateLimitWindowMs`, `rateLimitMaxAttempts`

## Cloud Functions

1. `validateAnswer`
   - **Payload**: `{ sessionId, puzzleId, attempt: string }`
   - **Checks**: rate limit per session (max 5/min), compares hashed attempt with stored `answerHash`.
   - **Responses**:
     - `correct`: returns `true`, next cooldown duration, and `penaltyExpiresAt`.
     - `incorrect`: increments `incorrectAttempts`, returns new `penaltyExpiresAt` (penaltyBase + increment * fails).
   - **Side effects**: updates Firestore `sessions/{sessionId}` fields and logs attempt.

2. `requestHint`
   - **Payload**: `{ sessionId, puzzleId }`
   - **Action**: increments `hintsUsed`, multiplies penalty by `hintMultiplier`, returns hint text.

3. `adminAuthenticate`
   - **Payload**: `{ password }`
   - **Checks**: compares hashed password stored in env var, returns admin token.

## Security rules

- Sessions can only be read/written by the matching `sessionId` (or anonymous Firebase Auth uid) — ensure `request.auth.token.sessionId` is enforced.
- Admin settings/document only accessible with `admin` custom claim.
- Prevent clients from setting `solved` timestamps ahead of `now` or altering `penaltyExpiresAt` arbitrarily.

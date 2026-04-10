export type PuzzleId = `${number}`;

export type PuzzleType = 'text' | 'choice' | 'slider' | 'selection' | 'number' | 'dual-slider' | 'dropdown' | 'counter' | 'image-tap' | 'ordered';

export interface PuzzleConfig {
  id: PuzzleId;
  title: string;
  theme: string;
  question: string;
  description?: string;
  type: PuzzleType;
  options?: string[];
  counterMin?: number;
  counterMax?: number;
  counterStep?: number;
  counterUnit?: string;
  imageTapSrc?: string;
  imageTapZones?: { label: string; x: number; y: number; w: number; h: number }[];
  answerHash: string;
  demoAnswer?: string;
  hints: [
    { title: 'Subtle'; text: string },
    { title: 'Direct'; text: string }
  ];
  hintEnabled: boolean;
  penaltyBase: number; // seconds
  penaltyIncrement: number; // seconds per failed attempt
  penaltyMultiplierOnHint: number;
  cooldownMin: number; // seconds before next puzzle unlocks
  visuals?: {
    src: string;
    alt: string;
    caption?: string;
  }[];
  relatedGift: string;
}

export interface SessionProgress {
  sessionId: string;
  currentPuzzle: PuzzleId;
  solved: Record<PuzzleId, number>;
  incorrectAttempts: Record<PuzzleId, number>;
  hintsUsed: Record<PuzzleId, number>;
  penaltyExpiresAt: number;
  cooldownExpiresAt: number;
  sessionStart: number;
  totalElapsedMs: number;
  lastUpdated: number;
}

export interface PenaltyStatus {
  active: boolean;
  remainingSeconds: number;
  attempts: number;
}

export interface AdminSettings {
  penaltyBase: number;
  penaltyIncrement: number;
  hintMultiplier: number;
  cooldownBase: number;
  maxHintsPerPuzzle: number;
  rateLimitWindowMs: number;
  rateLimitMaxAttempts: number;
  adminPasswordHash: string;
}

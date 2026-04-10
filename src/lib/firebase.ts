import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, collection } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { PuzzleId } from '../types/puzzle';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);

export const sessionsCollection = collection(firestore, 'sessions');
export const puzzlesCollection = collection(firestore, 'puzzles');
export const adminSettingsDoc = doc(firestore, 'config', 'adminSettings');

export const validateAnswer = httpsCallable(functions, 'validateAnswer');
export const requestHint = httpsCallable(functions, 'requestHint');
export const fetchAdminMetrics = httpsCallable(functions, 'fetchAdminMetrics');

export type AnswerValidationPayload = {
  sessionId: string;
  puzzleId: PuzzleId;
  attempt: string;
};

export type AdminMetricsResult = {
  sessionId: string;
  puzzles: Record<PuzzleId, { timeSpent: number; attempts: number; hints: number }>;
  elapsedMs: number;
  penaltyTimers: Record<PuzzleId, number>;
};

export function generateSessionToken() {
  const existing = localStorage.getItem('gift-session');
  if (existing) return existing;
  const token = crypto.randomUUID();
  localStorage.setItem('gift-session', token);
  return token;
}

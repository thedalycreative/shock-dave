import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Use a fixed document for the game state
const GAME_DOC_ID = "main-game";
const gameRef = doc(db, "sessions", GAME_DOC_ID);

export { db, gameRef, onSnapshot, setDoc, updateDoc, getDoc };

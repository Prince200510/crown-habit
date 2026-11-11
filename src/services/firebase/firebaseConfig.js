import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

const CUSTOM_FIREBASE_KEY = 'crown_habit_v1_firebase_config';

export function getFirebaseRuntimeConfig() {
  try {
    const saved = window.localStorage.getItem(CUSTOM_FIREBASE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch {
    void 0;
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };
}

export function saveCustomFirebaseConfig(config) {
  window.localStorage.setItem(CUSTOM_FIREBASE_KEY, JSON.stringify(config));
}

export function clearCustomFirebaseConfig() {
  window.localStorage.removeItem(CUSTOM_FIREBASE_KEY);
}

export function isFirebaseConfigured() {
  const cfg = getFirebaseRuntimeConfig();
  return Boolean(cfg.apiKey && cfg.projectId);
}

let appInstance = null;
let authInstance = null;
let dbInstance = null;

export function getFirebaseServices() {
  if (!isFirebaseConfigured()) {
    return { app: null, auth: null, db: null, configured: false };
  }

  try {
    if (!appInstance) {
      const existing = getApps();
      if (existing.length > 0) {
        appInstance = existing[0];
        dbInstance = getFirestore(appInstance);
      } else {
        appInstance = initializeApp(getFirebaseRuntimeConfig());
        dbInstance = initializeFirestore(appInstance, {
          experimentalAutoDetectLongPolling: true
        });
      }
      authInstance = getAuth(appInstance);
    }
    return { app: appInstance, auth: authInstance, db: dbInstance, configured: true };
  } catch {
    return { app: null, auth: null, db: null, configured: false };
  }
}

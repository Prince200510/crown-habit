import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  documentId
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirebaseServices } from './firebaseConfig';

function sanitizeRoutineForFirestore(routine) {
  return {
    id: String(routine.id),
    name: String(routine.name || '').slice(0, 120),
    description: String(routine.description || '').slice(0, 300),
    category: String(routine.category || 'General').slice(0, 40),
    scheduledTime: String(routine.scheduledTime || '08:00'),
    calories: Math.max(0, Math.round(Number(routine.calories) || 0)),
    protein: Math.max(0, Math.round((Number(routine.protein) || 0) * 10) / 10),
    carbs: Math.max(0, Math.round((Number(routine.carbs) || 0) * 10) / 10),
    fat: Math.max(0, Math.round((Number(routine.fat) || 0) * 10) / 10),
    reminderEnabled: Boolean(routine.reminderEnabled),
    followUpEnabled: Boolean(routine.followUpEnabled),
    followUpMinutes: Number(routine.followUpMinutes) || 15,
    repeatSchedule: String(routine.repeatSchedule || 'daily'),
    active: routine.active !== false,
    order: Number(routine.order) || 0,
    updatedAt: new Date().toISOString()
  };
}

function sanitizeFoodEntryForFirestore(entry) {
  const subItems = Array.isArray(entry.subItems)
    ? entry.subItems.map((sub, idx) => ({
        id: String(sub.id || `sub_${idx}`),
        name: String(sub.name || 'Item').slice(0, 120),
        quantity: Number(sub.quantity) || 1,
        unit: String(sub.unit || 'serving').slice(0, 30),
        weightG: Number(sub.weightG || sub.estimated_weight_g || 100),
        calories: Math.round(Number(sub.calories ?? sub.calories_kcal) || 0),
        protein: Math.round((Number(sub.protein ?? sub.protein_g) || 0) * 10) / 10,
        carbs: Math.round((Number(sub.carbs ?? sub.carbs_g) || 0) * 10) / 10,
        fat: Math.round((Number(sub.fat ?? sub.fat_g) || 0) * 10) / 10,
        fibre: Math.round((Number(sub.fibre ?? sub.fibre_g) || 0) * 10) / 10
      }))
    : [];

  return {
    id: String(entry.id),
    name: String(entry.name || 'Food').slice(0, 140),
    quantity: Number(entry.quantity) || 1,
    unit: String(entry.unit || 'serving').slice(0, 30),
    weightG: Number(entry.weightG || entry.estimated_weight_g || 100),
    category: String(entry.category || 'Lunch'),
    calories: Math.round(Number(entry.calories) || 0),
    protein: Math.round((Number(entry.protein) || 0) * 10) / 10,
    carbs: Math.round((Number(entry.carbs) || 0) * 10) / 10,
    fat: Math.round((Number(entry.fat) || 0) * 10) / 10,
    fibre: Math.round((Number(entry.fibre) || 0) * 10) / 10,
    isOutsideFood: Boolean(entry.isOutsideFood || entry.category === 'Outside food'),
    consumedAt: String(entry.consumedAt || new Date().toISOString()),
    notes: String(entry.notes || '').slice(0, 200),
    source: String(entry.source || 'manual'),
    subItems
  };
}

export function sanitizeDailyRecordForFirestore(record) {
  const compactHabits = {};
  const rawHabits = record.habitStatuses || {};
  Object.keys(rawHabits).forEach((routineId) => {
    const item = rawHabits[routineId];
    compactHabits[routineId] = {
      status: item.status || 'pending',
      updatedAt: item.updatedAt || null,
      name: String(item.name || '').slice(0, 120),
      scheduledTime: String(item.scheduledTime || '08:00'),
      category: String(item.category || 'General'),
      calories: Math.max(0, Math.round(Number(item.calories) || 0)),
      protein: Math.max(0, Math.round((Number(item.protein) || 0) * 10) / 10),
      carbs: Math.max(0, Math.round((Number(item.carbs) || 0) * 10) / 10),
      fat: Math.max(0, Math.round((Number(item.fat) || 0) * 10) / 10)
    };
  });

  const compactFoods = (record.foodEntries || []).map(sanitizeFoodEntryForFirestore);
  const completedCount = Object.values(compactHabits).filter(
    (h) => h.status === 'completed'
  ).length;
  const totalHabitsCount = Object.keys(compactHabits).length;
  const completionPercentage =
    totalHabitsCount > 0 ? Math.round((completedCount / totalHabitsCount) * 100) : 0;

  const rawActivity = record.activitySummary || {};
  const activitySummary = {
    steps: Math.max(0, Math.round(Number(rawActivity.steps) || 0)),
    activeSeconds: Math.max(0, Math.round(Number(rawActivity.activeSeconds) || 0)),
    distanceKm: Math.max(0, Math.round((Number(rawActivity.distanceKm) || 0) * 100) / 100),
    caloriesBurned: Math.max(0, Math.round(Number(rawActivity.caloriesBurned) || 0))
  };

  return {
    date: String(record.date),
    timezone: String(record.timezone || 'Asia/Kolkata'),
    habitStatuses: compactHabits,
    completedCount,
    totalHabitsCount,
    completionPercentage,
    foodEntries: compactFoods,
    activitySummary,
    createdAt: String(record.createdAt || new Date().toISOString()),
    updatedAt: new Date().toISOString()
  };
}

export async function loginWithEmail(email, password) {
  const { auth, configured } = getFirebaseServices();
  if (!configured || !auth) {
    throw new Error('Firebase is not configured.');
  }
  await setPersistence(auth, browserLocalPersistence);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function registerWithEmail(email, password, displayName) {
  const { auth, db, configured } = getFirebaseServices();
  if (!configured || !auth) {
    throw new Error('Firebase is not configured.');
  }
  await setPersistence(auth, browserLocalPersistence);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    updateProfile(cred.user, { displayName }).catch(() => {});
  }
  if (db) {
    const userRef = doc(db, 'users', cred.user.uid);
    setDoc(
      userRef,
      {
        displayName: displayName || email.split('@')[0],
        email,
        timezone: 'Asia/Kolkata',
        resetTime: '00:00',
        notificationsEnabled: true,
        followUpMinutes: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    ).catch(() => {});
  }
  return cred.user;
}

export async function logoutFirebaseUser() {
  const { auth } = getFirebaseServices();
  if (auth) {
    await fbSignOut(auth);
  }
}

export async function saveUserProfileToFirestore(userId, settings) {
  const { db } = getFirebaseServices();
  if (!db || !userId) return false;
  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    {
      displayName: String(settings.displayName || 'Crown User').slice(0, 80),
      timezone: String(settings.timezone || 'Asia/Kolkata'),
      resetTime: String(settings.resetTime || '00:00'),
      notificationsEnabled: Boolean(settings.notificationsEnabled),
      followUpMinutes: Number(settings.followUpMinutes) || 15,
      nutritionGoals: settings.nutritionGoals || {},
      scannerPreferences: settings.scannerPreferences || {},
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );
  return true;
}

export async function fetchUserRoutinesFromFirestore(userId) {
  const { db } = getFirebaseServices();
  if (!db || !userId) return null;
  const routinesCol = collection(db, 'users', userId, 'routines');
  const q = query(routinesCol, orderBy('order', 'asc'), limit(100));
  const snapshot = await getDocs(q);
  const routines = [];
  snapshot.forEach((docSnap) => {
    routines.push({ id: docSnap.id, ...docSnap.data() });
  });
  return routines;
}

export async function upsertRoutineInFirestore(userId, routine) {
  const { db } = getFirebaseServices();
  if (!db || !userId) return false;
  const routineRef = doc(db, 'users', userId, 'routines', routine.id);
  await setDoc(routineRef, sanitizeRoutineForFirestore(routine), { merge: true });
  return true;
}

export async function deleteRoutineFromFirestore(userId, routineId) {
  const { db } = getFirebaseServices();
  if (!db || !userId) return false;
  const routineRef = doc(db, 'users', userId, 'routines', routineId);
  await deleteDoc(routineRef);
  return true;
}

export async function fetchDailyRecordFromFirestore(userId, dateKey) {
  const { db } = getFirebaseServices();
  if (!db || !userId || !dateKey) return null;
  const docRef = doc(db, 'users', userId, 'dailyRecords', dateKey);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data();
}

export async function upsertDailyRecordInFirestore(userId, dateKey, record) {
  const { db } = getFirebaseServices();
  if (!db || !userId || !dateKey) return false;
  const docRef = doc(db, 'users', userId, 'dailyRecords', dateKey);
  const sanitized = sanitizeDailyRecordForFirestore(record);
  await setDoc(docRef, sanitized, { merge: true });
  return true;
}

export async function fetchPaginatedDailyRecords(userId, pageSize = 14, lastDateCursor = null) {
  const { db } = getFirebaseServices();
  if (!db || !userId) return { records: [], nextCursor: null };
  const colRef = collection(db, 'users', userId, 'dailyRecords');
  const constraints = [orderBy('date', 'desc'), limit(pageSize)];
  if (lastDateCursor) {
    constraints.push(startAfter(lastDateCursor));
  }
  const q = query(colRef, ...constraints);
  const snap = await getDocs(q);
  const records = [];
  snap.forEach((d) => records.push(d.data()));
  const nextCursor = records.length === pageSize ? records[records.length - 1].date : null;
  return { records, nextCursor };
}

export async function fetchDateRangeRecordsFromFirestore(userId, startDateKey, endDateKey) {
  const { db } = getFirebaseServices();
  if (!db || !userId) return [];
  const colRef = collection(db, 'users', userId, 'dailyRecords');
  const q = query(
    colRef,
    where(documentId(), '>=', startDateKey),
    where(documentId(), '<=', endDateKey),
    limit(35)
  );
  const snap = await getDocs(q);
  const records = [];
  snap.forEach((d) => records.push(d.data()));
  return records;
}

export function subscribeToDailyRecord(userId, dateKey, onRecordChange) {
  const { db } = getFirebaseServices();
  if (!db || !userId || !dateKey) return () => {};
  const docRef = doc(db, 'users', userId, 'dailyRecords', dateKey);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists() && typeof onRecordChange === 'function') {
        onRecordChange(snap.data());
      }
    },
    () => {}
  );
}

export function subscribeToUserRoutines(userId, onRoutinesChange) {
  const { db } = getFirebaseServices();
  if (!db || !userId) return () => {};
  const routinesCol = collection(db, 'users', userId, 'routines');
  const q = query(routinesCol, orderBy('order', 'asc'), limit(100));
  return onSnapshot(
    q,
    (snapshot) => {
      const routines = [];
      snapshot.forEach((docSnap) => {
        routines.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (routines.length > 0 && typeof onRoutinesChange === 'function') {
        onRoutinesChange(routines);
      }
    },
    () => {}
  );
}

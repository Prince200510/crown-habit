import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseServices } from '../services/firebase/firebaseConfig';
import {
  fetchUserRoutinesFromFirestore,
  upsertRoutineInFirestore,
  deleteRoutineFromFirestore,
  fetchDailyRecordFromFirestore,
  upsertDailyRecordInFirestore,
  saveUserProfileToFirestore,
  subscribeToDailyRecord,
  subscribeToUserRoutines,
  loginWithEmail,
  registerWithEmail,
  logoutFirebaseUser
} from '../services/firebase/firestoreService';
import {
  hydrateFromNativePreferences,
  getStoredSettings,
  saveStoredSettings,
  getStoredRoutines,
  saveStoredRoutines,
  getStoredDailyRecord,
  saveStoredDailyRecord,
  getAllStoredDailyRecords,
  getLastActiveDate,
  setLastActiveDate,
  getSyncQueue,
  enqueueSyncOperation,
  removeSyncOperation,
  saveLocalThumbnail,
  removeLocalThumbnail,
  getLocalUserProfile,
  saveLocalUserProfile,
  authenticateLocalAccount,
  registerLocalAccount
} from '../services/localStorage/storageService';
import {
  reconcileDailyNotifications,
  cancelFollowUpNotification,
  cancelRoutineNotifications
} from '../services/notifications/notificationService';
import {
  getTodayDateKey,
  shouldRoutineRunOnDate
} from '../utils/dateUtils';
import { calculateDailyNutritionSummary } from '../services/nutrition/nutritionService';
import {
  calculateWalkingMetrics,
  startAlwaysOnStepSensor
} from '../services/nutrition/stepTrackerService';

export const AppContext = createContext(null);

function inferMealCategoryFromRoutine(routine) {
  const nameLower = String(routine?.name || '').toLowerCase();
  if (nameLower.includes('breakfast') || nameLower.includes('oats') || nameLower.includes('morning')) {
    return 'Breakfast';
  }
  if (nameLower.includes('lunch')) return 'Lunch';
  if (nameLower.includes('dinner')) return 'Dinner';
  if (nameLower.includes('shake') || nameLower.includes('snack') || nameLower.includes('protien') || nameLower.includes('protein')) {
    return 'Evening snack';
  }
  const hour = Number(String(routine?.scheduledTime || '08:00').split(':')[0]) || 8;
  if (hour < 11) return 'Breakfast';
  if (hour < 16) return 'Lunch';
  if (hour < 19) return 'Evening snack';
  return 'Dinner';
}

function syncRoutineFoodEntryInList(existingFoodEntries, routine, isCompleted) {
  const list = Array.isArray(existingFoodEntries) ? [...existingFoodEntries] : [];
  if (!routine?.id) return list;

  const entryId = `routine_meal_${routine.id}`;
  const filtered = list.filter((e) => e.id !== entryId);

  const kcal = Math.max(0, Math.round(Number(routine.calories) || 0));
  const prot = Math.max(0, Math.round((Number(routine.protein) || 0) * 10) / 10);
  const carbs = Math.max(0, Math.round((Number(routine.carbs) || 0) * 10) / 10);
  const fat = Math.max(0, Math.round((Number(routine.fat) || 0) * 10) / 10);

  if (!isCompleted || (kcal === 0 && prot === 0 && carbs === 0 && fat === 0)) {
    return filtered;
  }

  const existingMatch = list.find((e) => e.id === entryId);
  filtered.push({
    id: entryId,
    name: routine.name || 'Routine Meal',
    quantity: 1,
    unit: 'routine',
    weightG: 250,
    category: inferMealCategoryFromRoutine(routine),
    calories: kcal,
    protein: prot,
    carbs,
    fat,
    fibre: Math.round((carbs * 0.12) * 10) / 10,
    isOutsideFood: false,
    consumedAt: existingMatch?.consumedAt || new Date().toISOString(),
    notes: 'Auto-logged from Daily Routine',
    source: 'routine'
  });

  return filtered;
}

function buildInitialDailyRecord(dateKey, routines, timezone = 'Asia/Kolkata') {
  const habitStatuses = {};
  routines.forEach((routine) => {
    if (shouldRoutineRunOnDate(routine, dateKey)) {
      habitStatuses[routine.id] = {
        routineId: routine.id,
        name: routine.name,
        category: routine.category || 'General',
        scheduledTime: routine.scheduledTime || '08:00',
        calories: Number(routine.calories) || 0,
        protein: Number(routine.protein) || 0,
        carbs: Number(routine.carbs) || 0,
        fat: Number(routine.fat) || 0,
        status: 'pending',
        updatedAt: null
      };
    }
  });

  return {
    date: dateKey,
    timezone,
    habitStatuses,
    foodEntries: [],
    activitySummary: {
      steps: 0,
      activeSeconds: 0,
      distanceKm: 0,
      caloriesBurned: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function mergeRoutineTemplatesIntoTodayRecord(record, routines, dateKey) {
  const existingStatuses = { ...(record.habitStatuses || {}) };
  let foodList = Array.isArray(record.foodEntries) ? [...record.foodEntries] : [];
  let changed = false;

  routines.forEach((routine) => {
    const runsToday = shouldRoutineRunOnDate(routine, dateKey);
    if (runsToday && !existingStatuses[routine.id]) {
      existingStatuses[routine.id] = {
        routineId: routine.id,
        name: routine.name,
        category: routine.category || 'General',
        scheduledTime: routine.scheduledTime || '08:00',
        calories: Number(routine.calories) || 0,
        protein: Number(routine.protein) || 0,
        carbs: Number(routine.carbs) || 0,
        fat: Number(routine.fat) || 0,
        status: 'pending',
        updatedAt: null
      };
      changed = true;
    } else if (existingStatuses[routine.id]) {
      const prevItem = existingStatuses[routine.id];
      const nextKcal = Number(routine.calories ?? prevItem.calories) || 0;
      const nextProt = Number(routine.protein ?? prevItem.protein) || 0;
      const nextCarbs = Number(routine.carbs ?? prevItem.carbs) || 0;
      const nextFat = Number(routine.fat ?? prevItem.fat) || 0;

      if (
        prevItem.name !== routine.name ||
        prevItem.scheduledTime !== routine.scheduledTime ||
        prevItem.category !== routine.category ||
        Number(prevItem.calories || 0) !== nextKcal ||
        Number(prevItem.protein || 0) !== nextProt ||
        Number(prevItem.carbs || 0) !== nextCarbs ||
        Number(prevItem.fat || 0) !== nextFat
      ) {
        existingStatuses[routine.id] = {
          ...prevItem,
          name: routine.name,
          scheduledTime: routine.scheduledTime,
          category: routine.category || 'General',
          calories: nextKcal,
          protein: nextProt,
          carbs: nextCarbs,
          fat: nextFat
        };
        changed = true;
      }

      if (prevItem.status === 'completed' && (nextKcal > 0 || nextProt > 0 || nextCarbs > 0)) {
        const syncedFoods = syncRoutineFoodEntryInList(
          foodList,
          { ...routine, calories: nextKcal, protein: nextProt, carbs: nextCarbs, fat: nextFat },
          true
        );
        if (syncedFoods.length !== foodList.length) {
          foodList = syncedFoods;
          changed = true;
        }
      }
    }
  });

  if (!changed) return record;
  return {
    ...record,
    habitStatuses: existingStatuses,
    foodEntries: foodList,
    updatedAt: new Date().toISOString()
  };
}

function mergeRemoteAndLocalDailyRecord(remoteRecord, localRecord, hasPendingLocalSync = false) {
  if (!remoteRecord) return localRecord;
  if (!localRecord) return remoteRecord;

  const remoteHabits = remoteRecord.habitStatuses || {};
  const localHabits = localRecord.habitStatuses || {};
  const allHabitIds = new Set([...Object.keys(localHabits), ...Object.keys(remoteHabits)]);
  const mergedHabits = {};

  allHabitIds.forEach((routineId) => {
    const rItem = remoteHabits[routineId];
    const lItem = localHabits[routineId];
    if (rItem && !lItem) {
      mergedHabits[routineId] = rItem;
    } else if (!rItem && lItem) {
      mergedHabits[routineId] = lItem;
    } else if (rItem && lItem) {
      const rTime = rItem.updatedAt ? new Date(rItem.updatedAt).getTime() : 0;
      const lTime = lItem.updatedAt ? new Date(lItem.updatedAt).getTime() : 0;
      if (rTime > lTime) {
        mergedHabits[routineId] = { ...lItem, ...rItem };
      } else if (lTime > rTime && hasPendingLocalSync) {
        mergedHabits[routineId] = { ...rItem, ...lItem };
      } else if (rItem.status !== 'pending' && lItem.status === 'pending' && !hasPendingLocalSync) {
        mergedHabits[routineId] = { ...lItem, ...rItem };
      } else {
        mergedHabits[routineId] = hasPendingLocalSync ? { ...rItem, ...lItem } : { ...lItem, ...rItem };
      }
    }
  });

  const remoteFoods = Array.isArray(remoteRecord.foodEntries) ? remoteRecord.foodEntries : [];
  const localFoods = Array.isArray(localRecord.foodEntries) ? localRecord.foodEntries : [];
  let mergedFoods = remoteFoods;

  if (hasPendingLocalSync) {
    const byId = new Map();
    remoteFoods.forEach((f) => byId.set(f.id, f));
    localFoods.forEach((f) => byId.set(f.id, f));
    mergedFoods = Array.from(byId.values());
  } else if (remoteFoods.length === 0 && localFoods.length > 0 && !remoteRecord.updatedAt) {
    mergedFoods = localFoods;
  }

  const rAct = remoteRecord.activitySummary || {};
  const lAct = localRecord.activitySummary || {};
  const mergedActivity = {
    steps: Math.max(Number(rAct.steps) || 0, Number(lAct.steps) || 0),
    activeSeconds: Math.max(Number(rAct.activeSeconds) || 0, Number(lAct.activeSeconds) || 0),
    distanceKm: Math.max(Number(rAct.distanceKm) || 0, Number(lAct.distanceKm) || 0),
    caloriesBurned: Math.max(Number(rAct.caloriesBurned) || 0, Number(lAct.caloriesBurned) || 0)
  };

  return {
    ...localRecord,
    ...remoteRecord,
    habitStatuses: mergedHabits,
    foodEntries: mergedFoods,
    activitySummary: mergedActivity,
    updatedAt: remoteRecord.updatedAt || localRecord.updatedAt || new Date().toISOString()
  };
}

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(() => getStoredSettings());
  const [routines, setRoutines] = useState(() => getStoredRoutines());
  const [todayDateKey, setTodayDateKey] = useState(() =>
    getTodayDateKey(settings.timezone, settings.resetTime)
  );
  const [todayRecord, setTodayRecord] = useState(() => {
    const key = getTodayDateKey(settings.timezone, settings.resetTime);
    const existing = getStoredDailyRecord(key);
    if (existing) return existing;
    const initial = buildInitialDailyRecord(key, getStoredRoutines(), settings.timezone);
    saveStoredDailyRecord(key, initial);
    return initial;
  });

  const [user, setUser] = useState(() => getLocalUserProfile());
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(() => {
    if (!navigator.onLine) return 'Offline';
    return getSyncQueue().length > 0 ? 'Sync pending' : 'Synced';
  });
  const [syncError, setSyncError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scannerPrefillOutside, setScannerPrefillOutside] = useState(false);

  const userRef = useRef(user);
  const isFlushingRef = useRef(false);
  const hydratedUidRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const flushSyncQueue = useCallback(async (overrideUser) => {
    if (isFlushingRef.current) return;
    const targetUser = overrideUser || userRef.current;
    if (!navigator.onLine) {
      setSyncStatus('Offline');
      return;
    }

    const queue = getSyncQueue();
    if (queue.length === 0) {
      setSyncStatus('Synced');
      return;
    }

    const { auth, configured } = getFirebaseServices();
    const resolvedUid = auth?.currentUser?.uid || (!targetUser?.isLocalOnly ? targetUser?.uid : null);
    if (!configured || !resolvedUid) {
      setSyncStatus('Synced');
      return;
    }

    isFlushingRef.current = true;
    setSyncStatus('Sync pending');
    setSyncError('');

    try {
      for (const op of queue) {
        if (op.type === 'UPSERT_DAILY_RECORD') {
          const localRec = getStoredDailyRecord(op.dateKey);
          if (localRec) {
            await upsertDailyRecordInFirestore(resolvedUid, op.dateKey, localRec);
          }
        } else if (op.type === 'UPSERT_ROUTINE') {
          const currentRoutines = getStoredRoutines();
          const found = currentRoutines.find((r) => r.id === op.targetId);
          if (found) {
            await upsertRoutineInFirestore(resolvedUid, found);
          }
        } else if (op.type === 'DELETE_ROUTINE') {
          await deleteRoutineFromFirestore(resolvedUid, op.targetId);
        } else if (op.type === 'SAVE_SETTINGS') {
          await saveUserProfileToFirestore(resolvedUid, getStoredSettings());
        }
        removeSyncOperation(op.dedupeKey);
      }
      setSyncStatus('Synced');
    } catch (err) {
      setSyncStatus('Sync failed');
      setSyncError(err?.message || 'Firestore write failed. Check Firestore rules in Firebase Console.');
    } finally {
      isFlushingRef.current = false;
    }
  }, []);

  const queueOrSyncOperation = useCallback(
    (op) => {
      const activeUser = userRef.current;
      const { auth, configured } = getFirebaseServices();
      const hasFirebaseUid = Boolean(auth?.currentUser?.uid || (activeUser?.uid && !activeUser?.isLocalOnly));
      if (!configured || !hasFirebaseUid) {
        setSyncStatus(navigator.onLine ? 'Synced' : 'Offline');
        return;
      }

      enqueueSyncOperation(op);
      if (!navigator.onLine) {
        setSyncStatus('Offline');
        return;
      }

      void flushSyncQueue(activeUser);
    },
    [flushSyncQueue]
  );

  const initializeOrResetDay = useCallback(
    (targetDateKey, currentRoutines, currentSettings) => {
      let record = getStoredDailyRecord(targetDateKey);

      if (!record) {
        record = buildInitialDailyRecord(targetDateKey, currentRoutines, currentSettings.timezone);
        record = saveStoredDailyRecord(targetDateKey, record);
        queueOrSyncOperation({
          type: 'UPSERT_DAILY_RECORD',
          dateKey: targetDateKey,
          dedupeKey: `daily_${targetDateKey}`
        });
      } else {
        const merged = mergeRoutineTemplatesIntoTodayRecord(record, currentRoutines, targetDateKey);
        if (merged !== record) {
          record = saveStoredDailyRecord(targetDateKey, merged);
        }
      }

      setTodayDateKey(targetDateKey);
      setTodayRecord(record);
      setLastActiveDate(targetDateKey);

      void reconcileDailyNotifications(currentRoutines, record, targetDateKey);
    },
    [queueOrSyncOperation]
  );

  useEffect(() => {
    hydrateFromNativePreferences().then(() => {
      const hydratedSettings = getStoredSettings();
      const hydratedRoutines = getStoredRoutines();
      const key = getTodayDateKey(hydratedSettings.timezone, hydratedSettings.resetTime);
      setSettings(hydratedSettings);
      setRoutines(hydratedRoutines);
      initializeOrResetDay(key, hydratedRoutines, hydratedSettings);
    });
  }, [initializeOrResetDay]);

  useEffect(() => {
    const { auth, configured } = getFirebaseServices();
    if (!configured || !auth) return undefined;

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return;

      const storedProfile = getLocalUserProfile();
      if (storedProfile?.sessionExpiresAt && Date.now() > Number(storedProfile.sessionExpiresAt)) {
        await logoutFirebaseUser();
        setUser(null);
        saveLocalUserProfile(null);
        return;
      }

      const profile = saveLocalUserProfile({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName:
          fbUser.displayName ||
          storedProfile?.displayName ||
          fbUser.email?.split('@')[0] ||
          'Crown User',
        isLocalOnly: false,
        loggedInAt: storedProfile?.loggedInAt,
        sessionExpiresAt: storedProfile?.sessionExpiresAt
      });

      setUser((prev) => {
        if (prev?.uid === profile.uid && prev?.email === profile.email) {
          return prev;
        }
        return profile;
      });

      if (hydratedUidRef.current === fbUser.uid) return;
      hydratedUidRef.current = fbUser.uid;

      if (navigator.onLine) {
        try {
          const remoteRoutines = await fetchUserRoutinesFromFirestore(fbUser.uid);
          if (remoteRoutines && remoteRoutines.length > 0) {
            const saved = saveStoredRoutines(remoteRoutines);
            setRoutines(saved);
          } else {
            const localRoutines = getStoredRoutines();
            for (const r of localRoutines) {
              await upsertRoutineInFirestore(fbUser.uid, r);
            }
          }

          const currentSettings = getStoredSettings();
          const currentKey = getTodayDateKey(currentSettings.timezone, currentSettings.resetTime);
          const localToday = getStoredDailyRecord(currentKey);
          const hasPendingLocalSync = getSyncQueue().some(
            (op) => op.type === 'UPSERT_DAILY_RECORD' && op.dateKey === currentKey
          );
          const remoteToday = await fetchDailyRecordFromFirestore(fbUser.uid, currentKey);
          if (remoteToday) {
            const mergedToday = mergeRemoteAndLocalDailyRecord(
              remoteToday,
              localToday,
              hasPendingLocalSync
            );
            const savedToday = saveStoredDailyRecord(currentKey, mergedToday);
            setTodayRecord(savedToday);
            if (hasPendingLocalSync) {
              await upsertDailyRecordInFirestore(fbUser.uid, currentKey, savedToday);
            }
          } else if (localToday) {
            await upsertDailyRecordInFirestore(fbUser.uid, currentKey, localToday);
          }
          void flushSyncQueue(profile);
        } catch (err) {
          setSyncStatus('Sync failed');
          setSyncError(err?.message || 'Could not sync with Cloud Firestore.');
        }
      }
    });

    return () => unsub();
  }, [flushSyncQueue]);

  useEffect(() => {
    const activeUid = user?.uid && !user?.isLocalOnly ? user.uid : null;
    if (!activeUid || !todayDateKey) return undefined;

    const unsubRecord = subscribeToDailyRecord(activeUid, todayDateKey, (remoteData) => {
      if (!remoteData) return;
      const hasPendingLocal = getSyncQueue().some(
        (op) => op.type === 'UPSERT_DAILY_RECORD' && op.dateKey === todayDateKey
      );
      const currentLocal = getStoredDailyRecord(todayDateKey);
      const merged = mergeRemoteAndLocalDailyRecord(remoteData, currentLocal, hasPendingLocal);
      const saved = saveStoredDailyRecord(todayDateKey, merged);
      setTodayRecord(saved);
    });

    const unsubRoutines = subscribeToUserRoutines(activeUid, (remoteRoutines) => {
      if (!remoteRoutines || remoteRoutines.length === 0) return;
      const saved = saveStoredRoutines(remoteRoutines);
      setRoutines(saved);
    });

    return () => {
      unsubRecord();
      unsubRoutines();
    };
  }, [user?.uid, user?.isLocalOnly, todayDateKey]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void flushSyncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushSyncQueue]);

  useEffect(() => {
    const interval = setInterval(() => {
      const calculatedKey = getTodayDateKey(settings.timezone, settings.resetTime);
      const lastKey = getLastActiveDate();
      if (calculatedKey !== todayDateKey || (lastKey && lastKey !== calculatedKey)) {
        initializeOrResetDay(calculatedKey, routines, settings);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [settings, routines, todayDateKey, initializeOrResetDay]);

  const updateHabitStatus = useCallback(
    (routineId, newStatus) => {
      const routine = routines.find((r) => r.id === routineId);
      const existing = todayRecord.habitStatuses?.[routineId] || {
        routineId,
        name: routine?.name || 'Habit',
        category: routine?.category || 'General',
        scheduledTime: routine?.scheduledTime || '08:00'
      };

      const resolvedRoutine = {
        id: routineId,
        name: routine?.name || existing.name || 'Habit',
        category: routine?.category || existing.category || 'General',
        scheduledTime: routine?.scheduledTime || existing.scheduledTime || '08:00',
        calories: Number(routine?.calories ?? existing.calories) || 0,
        protein: Number(routine?.protein ?? existing.protein) || 0,
        carbs: Number(routine?.carbs ?? existing.carbs) || 0,
        fat: Number(routine?.fat ?? existing.fat) || 0
      };

      const updatedHabitStatuses = {
        ...(todayRecord.habitStatuses || {}),
        [routineId]: {
          ...existing,
          ...resolvedRoutine,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      };

      const updatedFoodEntries = syncRoutineFoodEntryInList(
        todayRecord.foodEntries || [],
        resolvedRoutine,
        newStatus === 'completed'
      );

      const nextRecord = saveStoredDailyRecord(todayDateKey, {
        ...todayRecord,
        habitStatuses: updatedHabitStatuses,
        foodEntries: updatedFoodEntries
      });

      setTodayRecord(nextRecord);

      if (newStatus === 'completed' || newStatus === 'skipped') {
        void cancelFollowUpNotification(routineId);
      } else {
        void reconcileDailyNotifications(routines, nextRecord, todayDateKey);
      }

      queueOrSyncOperation({
        type: 'UPSERT_DAILY_RECORD',
        dateKey: todayDateKey,
        dedupeKey: `daily_${todayDateKey}`
      });
    },
    [routines, todayRecord, todayDateKey, queueOrSyncOperation]
  );

  const addOrUpdateRoutine = useCallback(
    (routineData) => {
      const isEdit = Boolean(routineData.id);
      const routineId = routineData.id || `routine_${Date.now()}`;
      const existingIndex = routines.findIndex((r) => r.id === routineId);

      let nextRoutines;
      let targetRoutine;

      if (existingIndex >= 0) {
        targetRoutine = {
          ...routines[existingIndex],
          ...routineData,
          id: routineId,
          calories: Math.max(0, Math.round(Number(routineData.calories ?? routines[existingIndex].calories) || 0)),
          protein: Math.max(0, Math.round((Number(routineData.protein ?? routines[existingIndex].protein) || 0) * 10) / 10),
          carbs: Math.max(0, Math.round((Number(routineData.carbs ?? routines[existingIndex].carbs) || 0) * 10) / 10),
          fat: Math.max(0, Math.round((Number(routineData.fat ?? routines[existingIndex].fat) || 0) * 10) / 10),
          updatedAt: new Date().toISOString()
        };
        nextRoutines = [...routines];
        nextRoutines[existingIndex] = targetRoutine;
      } else {
        targetRoutine = {
          id: routineId,
          name: routineData.name,
          description: routineData.description || '',
          category: routineData.category || 'General',
          scheduledTime: routineData.scheduledTime || '08:00',
          calories: Math.max(0, Math.round(Number(routineData.calories) || 0)),
          protein: Math.max(0, Math.round((Number(routineData.protein) || 0) * 10) / 10),
          carbs: Math.max(0, Math.round((Number(routineData.carbs) || 0) * 10) / 10),
          fat: Math.max(0, Math.round((Number(routineData.fat) || 0) * 10) / 10),
          reminderEnabled: routineData.reminderEnabled !== false,
          followUpEnabled: routineData.followUpEnabled !== false,
          followUpMinutes: Number(routineData.followUpMinutes) || 15,
          repeatSchedule: routineData.repeatSchedule || 'daily',
          active: routineData.active !== false,
          order: routines.length,
          createdAt: new Date().toISOString()
        };
        nextRoutines = [...routines, targetRoutine];
      }

      const savedRoutines = saveStoredRoutines(nextRoutines);
      setRoutines(savedRoutines);

      const updatedStatuses = { ...(todayRecord.habitStatuses || {}) };
      if (shouldRoutineRunOnDate(targetRoutine, todayDateKey)) {
        updatedStatuses[routineId] = {
          ...(updatedStatuses[routineId] || { status: 'pending', updatedAt: null }),
          routineId,
          name: targetRoutine.name,
          category: targetRoutine.category,
          scheduledTime: targetRoutine.scheduledTime,
          calories: targetRoutine.calories,
          protein: targetRoutine.protein,
          carbs: targetRoutine.carbs,
          fat: targetRoutine.fat
        };
      } else if (!isEdit || !targetRoutine.active) {
        if (updatedStatuses[routineId]?.status === 'pending') {
          delete updatedStatuses[routineId];
        }
      }

      const isCurrentlyCompleted = updatedStatuses[routineId]?.status === 'completed';
      const updatedFoodEntries = syncRoutineFoodEntryInList(
        todayRecord.foodEntries || [],
        targetRoutine,
        isCurrentlyCompleted
      );

      const nextRecord = saveStoredDailyRecord(todayDateKey, {
        ...todayRecord,
        habitStatuses: updatedStatuses,
        foodEntries: updatedFoodEntries
      });
      setTodayRecord(nextRecord);

      void reconcileDailyNotifications(savedRoutines, nextRecord, todayDateKey);

      queueOrSyncOperation({
        type: 'UPSERT_ROUTINE',
        targetId: routineId,
        dedupeKey: `routine_${routineId}`
      });
      queueOrSyncOperation({
        type: 'UPSERT_DAILY_RECORD',
        dateKey: todayDateKey,
        dedupeKey: `daily_${todayDateKey}`
      });

      return targetRoutine;
    },
    [routines, todayRecord, todayDateKey, queueOrSyncOperation]
  );

  const deleteRoutine = useCallback(
    (routineId) => {
      const nextRoutines = routines.filter((r) => r.id !== routineId);
      const savedRoutines = saveStoredRoutines(nextRoutines);
      setRoutines(savedRoutines);

      const updatedStatuses = { ...(todayRecord.habitStatuses || {}) };
      if (updatedStatuses[routineId]?.status === 'pending') {
        delete updatedStatuses[routineId];
      }
      const nextRecord = saveStoredDailyRecord(todayDateKey, {
        ...todayRecord,
        habitStatuses: updatedStatuses
      });
      setTodayRecord(nextRecord);

      void cancelRoutineNotifications(routineId);

      queueOrSyncOperation({
        type: 'DELETE_ROUTINE',
        targetId: routineId,
        dedupeKey: `del_routine_${routineId}`
      });
      queueOrSyncOperation({
        type: 'UPSERT_DAILY_RECORD',
        dateKey: todayDateKey,
        dedupeKey: `daily_${todayDateKey}`
      });
    },
    [routines, todayRecord, todayDateKey, queueOrSyncOperation]
  );

  const reorderRoutine = useCallback(
    (routineId, direction) => {
      const index = routines.findIndex((r) => r.id === routineId);
      if (index === -1) return;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= routines.length) return;

      const copy = [...routines];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      const saved = saveStoredRoutines(copy);
      setRoutines(saved);

      for (const r of saved) {
        queueOrSyncOperation({
          type: 'UPSERT_ROUTINE',
          targetId: r.id,
          dedupeKey: `routine_${r.id}`
        });
      }
    },
    [routines, queueOrSyncOperation]
  );

  const addFoodEntriesToDay = useCallback(
    (entriesArray, dateKey = todayDateKey, thumbnailDataUrl = null) => {
      const targetRecord =
        dateKey === todayDateKey
          ? todayRecord
          : getStoredDailyRecord(dateKey) || buildInitialDailyRecord(dateKey, routines, settings.timezone);

      const existingEntries = [...(targetRecord.foodEntries || [])];
      const existingIds = new Set(existingEntries.map((e) => e.id));

      entriesArray.forEach((rawEntry, index) => {
        const entryId = rawEntry.id || `food_${Date.now()}_${index}`;
        if (existingIds.has(entryId)) return;

        const isOutside = Boolean(
          rawEntry.isOutsideFood || rawEntry.category === 'Outside food'
        );

        const normalizedEntry = {
          id: entryId,
          name: String(rawEntry.name || 'Food Entry').trim(),
          quantity: Number(rawEntry.quantity) || 1,
          unit: String(rawEntry.unit || 'serving').trim(),
          weightG: Math.round(Number(rawEntry.weightG || rawEntry.estimated_weight_g || 100)),
          category: rawEntry.category || 'Lunch',
          calories: Math.round(Number(rawEntry.calories ?? rawEntry.calories_kcal) || 0),
          protein: Math.round((Number(rawEntry.protein ?? rawEntry.protein_g) || 0) * 10) / 10,
          carbs: Math.round((Number(rawEntry.carbs ?? rawEntry.carbs_g) || 0) * 10) / 10,
          fat: Math.round((Number(rawEntry.fat ?? rawEntry.fat_g) || 0) * 10) / 10,
          fibre: Math.round((Number(rawEntry.fibre ?? rawEntry.fibre_g) || 0) * 10) / 10,
          isOutsideFood: isOutside,
          consumedAt: rawEntry.consumedAt || new Date().toISOString(),
          notes: String(rawEntry.notes || '').trim(),
          source: rawEntry.source || 'manual',
          subItems: Array.isArray(rawEntry.subItems) ? rawEntry.subItems : []
        };

        if (thumbnailDataUrl && settings.scannerPreferences?.keepLocalThumbnails !== false) {
          saveLocalThumbnail(entryId, thumbnailDataUrl);
        }

        existingEntries.push(normalizedEntry);
        existingIds.add(entryId);
      });

      const updatedRecord = saveStoredDailyRecord(dateKey, {
        ...targetRecord,
        foodEntries: existingEntries
      });

      if (dateKey === todayDateKey) {
        setTodayRecord(updatedRecord);
      }

      queueOrSyncOperation({
        type: 'UPSERT_DAILY_RECORD',
        dateKey,
        dedupeKey: `daily_${dateKey}`
      });

      return updatedRecord;
    },
    [todayDateKey, todayRecord, routines, settings, queueOrSyncOperation]
  );

  const updateFoodEntryInDay = useCallback(
    (entryId, updatedFields, dateKey = todayDateKey) => {
      const targetRecord =
        dateKey === todayDateKey ? todayRecord : getStoredDailyRecord(dateKey);
      if (!targetRecord) return;

      const updatedEntries = (targetRecord.foodEntries || []).map((entry) => {
        if (entry.id !== entryId) return entry;
        const nextCategory = updatedFields.category ?? entry.category;
        const nextIsOutside =
          updatedFields.isOutsideFood !== undefined
            ? Boolean(updatedFields.isOutsideFood)
            : nextCategory === 'Outside food' || Boolean(entry.isOutsideFood);

        return {
          ...entry,
          ...updatedFields,
          category: nextCategory,
          isOutsideFood: nextIsOutside,
          calories: Math.round(Number(updatedFields.calories ?? entry.calories) || 0),
          protein: Math.round((Number(updatedFields.protein ?? entry.protein) || 0) * 10) / 10,
          carbs: Math.round((Number(updatedFields.carbs ?? entry.carbs) || 0) * 10) / 10,
          fat: Math.round((Number(updatedFields.fat ?? entry.fat) || 0) * 10) / 10,
          fibre: Math.round((Number(updatedFields.fibre ?? entry.fibre) || 0) * 10) / 10
        };
      });

      const nextRecord = saveStoredDailyRecord(dateKey, {
        ...targetRecord,
        foodEntries: updatedEntries
      });

      if (dateKey === todayDateKey) {
        setTodayRecord(nextRecord);
      }

      queueOrSyncOperation({
        type: 'UPSERT_DAILY_RECORD',
        dateKey,
        dedupeKey: `daily_${dateKey}`
      });
    },
    [todayDateKey, todayRecord, queueOrSyncOperation]
  );

  const deleteFoodEntryFromDay = useCallback(
    (entryId, dateKey = todayDateKey) => {
      const targetRecord =
        dateKey === todayDateKey ? todayRecord : getStoredDailyRecord(dateKey);
      if (!targetRecord) return;

      const updatedEntries = (targetRecord.foodEntries || []).filter((e) => e.id !== entryId);
      removeLocalThumbnail(entryId);

      const nextRecord = saveStoredDailyRecord(dateKey, {
        ...targetRecord,
        foodEntries: updatedEntries
      });

      if (dateKey === todayDateKey) {
        setTodayRecord(nextRecord);
      }

      queueOrSyncOperation({
        type: 'UPSERT_DAILY_RECORD',
        dateKey,
        dedupeKey: `daily_${dateKey}`
      });
    },
    [todayDateKey, todayRecord, queueOrSyncOperation]
  );

  const updateSettings = useCallback(
    (partialSettings) => {
      const next = saveStoredSettings(partialSettings);
      setSettings(next);

      const newKey = getTodayDateKey(next.timezone, next.resetTime);
      if (newKey !== todayDateKey) {
        initializeOrResetDay(newKey, routines, next);
      } else {
        void reconcileDailyNotifications(routines, todayRecord, todayDateKey);
      }

      queueOrSyncOperation({
        type: 'SAVE_SETTINGS',
        dedupeKey: 'user_settings'
      });
      return next;
    },
    [todayDateKey, routines, todayRecord, initializeOrResetDay, queueOrSyncOperation]
  );

  const getHistoricalRecord = useCallback(
    async (dateKey) => {
      if (dateKey === todayDateKey) return todayRecord;
      const local = getStoredDailyRecord(dateKey);
      if (local) return local;

      const activeUser = userRef.current;
      if (navigator.onLine && activeUser?.uid && !activeUser?.isLocalOnly) {
        try {
          const remote = await fetchDailyRecordFromFirestore(activeUser.uid, dateKey);
          if (remote) {
            return saveStoredDailyRecord(dateKey, remote);
          }
        } catch {
          void 0;
        }
      }
      return null;
    },
    [todayDateKey, todayRecord]
  );

  const signInUser = useCallback(async (email, password) => {
    const { configured } = getFirebaseServices();
    if (!configured) {
      const localProfile = authenticateLocalAccount(email, password);
      setUser(localProfile);
      return localProfile;
    }
    const fbUser = await loginWithEmail(email, password);
    const profile = saveLocalUserProfile({
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || email.split('@')[0],
      isLocalOnly: false
    });
    setUser(profile);
    setActiveTab('dashboard');
    return profile;
  }, []);

  const signUpUser = useCallback(async (email, password, displayName) => {
    const { configured } = getFirebaseServices();
    if (!configured) {
      const localProfile = registerLocalAccount(email, password, displayName);
      setUser(localProfile);
      return localProfile;
    }
    const fbUser = await registerWithEmail(email, password, displayName);
    const profile = saveLocalUserProfile({
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: displayName || email.split('@')[0],
      isLocalOnly: false
    });
    setUser(profile);
    setActiveTab('dashboard');
    return profile;
  }, []);

  const signOutUser = useCallback(async () => {
    hydratedUidRef.current = null;
    await logoutFirebaseUser().catch(() => {});
    setUser(null);
    saveLocalUserProfile(null);
  }, []);

  const todayNutrition = useMemo(
    () => calculateDailyNutritionSummary(todayRecord?.foodEntries || []),
    [todayRecord?.foodEntries]
  );

  const todayWalkingMetrics = useMemo(() => {
    const raw = todayRecord?.activitySummary || {};
    return calculateWalkingMetrics({
      steps: raw.steps || 0,
      activeSeconds: raw.activeSeconds || 0,
      weightKg: settings.nutritionGoals?.weightKg || 70,
      heightCm: settings.nutritionGoals?.heightCm || 172,
      foodCalories: todayNutrition.totalCalories || 0,
      calorieGoal: settings.nutritionGoals?.calories || 2000
    });
  }, [todayRecord?.activitySummary, settings.nutritionGoals, todayNutrition.totalCalories]);

  const updateWalkingActivity = useCallback(
    ({ absoluteSteps = null, addSteps = 0, addSeconds = 0, syncNow = false }) => {
      setTodayRecord((prevRecord) => {
        const prevActivity = prevRecord?.activitySummary || {};
        const prevSteps = Number(prevActivity.steps) || 0;
        const nextSteps =
          absoluteSteps !== null
            ? Math.max(prevSteps, Number(absoluteSteps) || 0)
            : Math.max(0, prevSteps + (Number(addSteps) || 0));

        if (nextSteps === prevSteps && !addSeconds && !syncNow) {
          return prevRecord;
        }

        const estimatedSeconds = Math.round((nextSteps / 100) * 60);
        const nextSeconds = Math.max(
          estimatedSeconds,
          (Number(prevActivity.activeSeconds) || 0) + (Number(addSeconds) || 0)
        );

        const metrics = calculateWalkingMetrics({
          steps: nextSteps,
          activeSeconds: nextSeconds,
          weightKg: settings.nutritionGoals?.weightKg || 70,
          heightCm: settings.nutritionGoals?.heightCm || 172,
          foodCalories: 0,
          calorieGoal: settings.nutritionGoals?.calories || 2000
        });

        const stepGoal = Number(settings.nutritionGoals?.dailyStepGoal) || 6000;
        const updatedHabitStatuses = { ...(prevRecord?.habitStatuses || {}) };
        if (nextSteps >= stepGoal || nextSeconds >= 30 * 60) {
          Object.keys(updatedHabitStatuses).forEach((rId) => {
            const h = updatedHabitStatuses[rId];
            if (
              h &&
              h.status === 'pending' &&
              (h.name || '').toLowerCase().includes('walk')
            ) {
              updatedHabitStatuses[rId] = {
                ...h,
                status: 'completed',
                updatedAt: new Date().toISOString()
              };
            }
          });
        }

        const nextRecord = saveStoredDailyRecord(todayDateKey, {
          ...prevRecord,
          habitStatuses: updatedHabitStatuses,
          activitySummary: {
            steps: metrics.steps,
            activeSeconds: metrics.activeSeconds,
            distanceKm: metrics.distanceKm,
            caloriesBurned: metrics.caloriesBurned
          }
        });

        if (syncNow || nextSteps - prevSteps >= 25) {
          queueOrSyncOperation({
            type: 'UPSERT_DAILY_RECORD',
            dateKey: todayDateKey,
            dedupeKey: `daily_${todayDateKey}`
          });
        }

        return nextRecord;
      });
    },
    [settings.nutritionGoals, todayDateKey, queueOrSyncOperation]
  );

  useEffect(() => {
    startAlwaysOnStepSensor({
      onAbsoluteSteps: (todaySteps) => {
        updateWalkingActivity({ absoluteSteps: todaySteps });
      },
      onIncrementSteps: (inc) => {
        updateWalkingActivity({ addSteps: inc, addSeconds: 1 });
      }
    });
  }, [updateWalkingActivity]);

  const todayHabitsSummary = useMemo(() => {
    const statusesMap = todayRecord?.habitStatuses || {};
    const activeTodayRoutines = routines.filter((r) => shouldRoutineRunOnDate(r, todayDateKey));

    const items = activeTodayRoutines.map((routine) => {
      const saved = statusesMap[routine.id];
      return {
        ...routine,
        status: saved?.status || 'pending',
        completedAt: saved?.updatedAt || null
      };
    });

    const total = items.length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const skipped = items.filter((i) => i.status === 'skipped').length;
    const missed = items.filter((i) => i.status === 'missed').length;
    const pending = items.filter((i) => i.status === 'pending').length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      items,
      total,
      completed,
      skipped,
      missed,
      pending,
      progressPercent
    };
  }, [routines, todayRecord?.habitStatuses, todayDateKey]);

  const contextValue = useMemo(
    () => ({
      user,
      settings,
      routines,
      todayDateKey,
      todayRecord,
      todayNutrition,
      todayWalkingMetrics,
      todayHabitsSummary,
      isOnline,
      syncStatus,
      syncError,
      activeTab,
      setActiveTab,
      scannerPrefillOutside,
      setScannerPrefillOutside,
      updateHabitStatus,
      updateWalkingActivity,
      addOrUpdateRoutine,
      deleteRoutine,
      reorderRoutine,
      addFoodEntriesToDay,
      updateFoodEntryInDay,
      deleteFoodEntryFromDay,
      updateSettings,
      getHistoricalRecord,
      getAllStoredDailyRecords,
      flushSyncQueue,
      signInUser,
      signUpUser,
      signOutUser
    }),
    [
      user,
      settings,
      routines,
      todayDateKey,
      todayRecord,
      todayNutrition,
      todayWalkingMetrics,
      todayHabitsSummary,
      isOnline,
      syncStatus,
      syncError,
      activeTab,
      scannerPrefillOutside,
      updateHabitStatus,
      updateWalkingActivity,
      addOrUpdateRoutine,
      deleteRoutine,
      reorderRoutine,
      addFoodEntriesToDay,
      updateFoodEntryInDay,
      deleteFoodEntryFromDay,
      updateSettings,
      getHistoricalRecord,
      flushSyncQueue,
      signInUser,
      signUpUser,
      signOutUser
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

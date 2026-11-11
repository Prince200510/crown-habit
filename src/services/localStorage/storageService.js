import { Preferences } from '@capacitor/preferences';

const PREFIX = 'crown_habit_v1_';

const KEYS = {
  ROUTINES: `${PREFIX}routines`,
  DAILY_RECORDS: `${PREFIX}daily_records`,
  SETTINGS: `${PREFIX}settings`,
  SYNC_QUEUE: `${PREFIX}sync_queue`,
  SYNC_STATE: `${PREFIX}sync_state`,
  NOTIFICATION_IDS: `${PREFIX}notification_ids`,
  LOCAL_IMAGES: `${PREFIX}local_images`,
  LAST_ACTIVE_DATE: `${PREFIX}last_active_date`,
  LOCAL_USER: `${PREFIX}local_user`,
  LOCAL_ACCOUNTS: `${PREFIX}local_accounts`
};

export const DEFAULT_SETTINGS = {
  displayName: 'Crown User',
  timezone: 'Asia/Kolkata',
  resetTime: '00:00',
  notificationsEnabled: true,
  followUpMinutes: 15,
  aiProxyUrl: import.meta.env.VITE_AI_PROXY_URL || '/api/analyze-meal',
  aiProxyToken: import.meta.env.VITE_AI_PROXY_SHARED_TOKEN || '',
  scannerPreferences: {
    compressImages: true,
    keepLocalThumbnails: true,
    defaultHomeOrOutside: 'home',
    indianCuisinePriority: true
  },
  nutritionGoals: {
    calories: 2000,
    protein: 75,
    carbs: 240,
    fat: 65,
    fibre: 30,
    outsideFoodLimitKcal: 400,
    weightKg: 70,
    heightCm: 172,
    dailyStepGoal: 6000
  }
};

export const DEFAULT_ROUTINES = [
  {
    id: 'routine_water_7am',
    name: 'Drink water',
    description: 'Start the morning with 500ml warm water for hydration',
    category: 'Hydration',
    scheduledTime: '07:00',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    reminderEnabled: true,
    followUpEnabled: true,
    followUpMinutes: 15,
    repeatSchedule: 'daily',
    active: true,
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'routine_oats_10am',
    name: 'Morning oats',
    description: 'High-fibre bowl of oats with nuts or seeds',
    category: 'Nutrition',
    scheduledTime: '10:00',
    calories: 320,
    protein: 12,
    carbs: 54,
    fat: 6,
    reminderEnabled: true,
    followUpEnabled: true,
    followUpMinutes: 15,
    repeatSchedule: 'daily',
    active: true,
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'routine_lunch_130pm',
    name: 'Healthy lunch',
    description: 'Balanced home-cooked Indian meal with dal, sabzi, chapati and curd',
    category: 'Nutrition',
    scheduledTime: '13:30',
    calories: 580,
    protein: 22,
    carbs: 78,
    fat: 16,
    reminderEnabled: true,
    followUpEnabled: true,
    followUpMinutes: 15,
    repeatSchedule: 'daily',
    active: true,
    order: 2,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'routine_walk_6pm',
    name: 'Evening walk',
    description: '30 minutes brisk outdoor walk or active movement',
    category: 'Fitness',
    scheduledTime: '18:00',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    reminderEnabled: true,
    followUpEnabled: true,
    followUpMinutes: 15,
    repeatSchedule: 'daily',
    active: true,
    order: 3,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'routine_dinner_830pm',
    name: 'Healthy dinner',
    description: 'Light, protein-rich dinner at least 2 hours before sleep',
    category: 'Nutrition',
    scheduledTime: '20:30',
    calories: 460,
    protein: 24,
    carbs: 50,
    fat: 14,
    reminderEnabled: true,
    followUpEnabled: true,
    followUpMinutes: 15,
    repeatSchedule: 'daily',
    active: true,
    order: 4,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'routine_sleep_11pm',
    name: 'Sleep before 11 PM',
    description: 'Wind down screens and get 7-8 hours of restorative sleep',
    category: 'Sleep',
    scheduledTime: '22:45',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    reminderEnabled: true,
    followUpEnabled: false,
    followUpMinutes: 15,
    repeatSchedule: 'daily',
    active: true,
    order: 5,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

function inferDefaultMacrosForRoutine(routine) {
  if (
    routine.calories !== undefined ||
    routine.protein !== undefined ||
    routine.carbs !== undefined ||
    routine.fat !== undefined
  ) {
    return {
      ...routine,
      calories: Math.max(0, Math.round(Number(routine.calories) || 0)),
      protein: Math.max(0, Math.round((Number(routine.protein) || 0) * 10) / 10),
      carbs: Math.max(0, Math.round((Number(routine.carbs) || 0) * 10) / 10),
      fat: Math.max(0, Math.round((Number(routine.fat) || 0) * 10) / 10)
    };
  }

  const lower = String(routine.name || '').toLowerCase();
  if (lower.includes('oats')) {
    return { ...routine, calories: 320, protein: 12, carbs: 54, fat: 6 };
  }
  if (lower.includes('lunch')) {
    return { ...routine, calories: 580, protein: 22, carbs: 78, fat: 16 };
  }
  if (lower.includes('dinner')) {
    return { ...routine, calories: 460, protein: 24, carbs: 50, fat: 14 };
  }
  if (lower.includes('shake') || lower.includes('protien') || lower.includes('protein')) {
    return { ...routine, calories: 180, protein: 25, carbs: 8, fat: 3 };
  }
  if (lower.includes('weight') || lower.includes('guts')) {
    return { ...routine, calories: 250, protein: 14, carbs: 32, fat: 7 };
  }
  return { ...routine, calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function readSync(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeSync(key, value) {
  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    Preferences.set({ key, value: serialized }).catch(() => {});
  } catch {
    return false;
  }
  return true;
}

export async function hydrateFromNativePreferences() {
  try {
    const keysToHydrate = Object.values(KEYS);
    for (const key of keysToHydrate) {
      const { value } = await Preferences.get({ key });
      if (value && !window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, value);
      }
    }
  } catch {
    return false;
  }
  return true;
}

export function getStoredSettings() {
  const saved = readSync(KEYS.SETTINGS, null);
  if (!saved) return { ...DEFAULT_SETTINGS };
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    scannerPreferences: {
      ...DEFAULT_SETTINGS.scannerPreferences,
      ...(saved.scannerPreferences || {})
    },
    nutritionGoals: {
      ...DEFAULT_SETTINGS.nutritionGoals,
      ...(saved.nutritionGoals || {})
    }
  };
}

export function saveStoredSettings(settings) {
  const merged = {
    ...getStoredSettings(),
    ...settings
  };
  writeSync(KEYS.SETTINGS, merged);
  return merged;
}

export function getStoredRoutines() {
  const saved = readSync(KEYS.ROUTINES, null);
  if (!saved || !Array.isArray(saved)) {
    writeSync(KEYS.ROUTINES, DEFAULT_ROUTINES);
    return [...DEFAULT_ROUTINES];
  }
  return [...saved]
    .map(inferDefaultMacrosForRoutine)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function saveStoredRoutines(routines) {
  const ordered = routines.map((r, idx) => ({
    ...inferDefaultMacrosForRoutine(r),
    order: idx
  }));
  writeSync(KEYS.ROUTINES, ordered);
  return ordered;
}

export function getAllStoredDailyRecords() {
  return readSync(KEYS.DAILY_RECORDS, {});
}

export function getStoredDailyRecord(dateKey) {
  const all = getAllStoredDailyRecords();
  return all[dateKey] || null;
}

export function saveStoredDailyRecord(dateKey, record) {
  const all = getAllStoredDailyRecords();
  const updated = {
    ...record,
    date: dateKey,
    updatedAt: new Date().toISOString()
  };
  all[dateKey] = updated;
  writeSync(KEYS.DAILY_RECORDS, all);
  return updated;
}

export function getLastActiveDate() {
  return readSync(KEYS.LAST_ACTIVE_DATE, null);
}

export function setLastActiveDate(dateKey) {
  writeSync(KEYS.LAST_ACTIVE_DATE, dateKey);
}

export function getSyncQueue() {
  return readSync(KEYS.SYNC_QUEUE, []);
}

export function enqueueSyncOperation(op) {
  const queue = getSyncQueue();
  const dedupeKey = op.dedupeKey || `${op.type}_${op.targetId || op.dateKey || Date.now()}`;
  const filtered = queue.filter((item) => item.dedupeKey !== dedupeKey);
  const next = [
    ...filtered,
    {
      ...op,
      dedupeKey,
      queuedAt: new Date().toISOString()
    }
  ];
  writeSync(KEYS.SYNC_QUEUE, next);
  return next;
}

export function removeSyncOperation(dedupeKey) {
  const queue = getSyncQueue();
  const next = queue.filter((item) => item.dedupeKey !== dedupeKey);
  writeSync(KEYS.SYNC_QUEUE, next);
  return next;
}

export function clearSyncQueue() {
  writeSync(KEYS.SYNC_QUEUE, []);
}

export function getStoredNotificationIds() {
  return readSync(KEYS.NOTIFICATION_IDS, {});
}

export function saveStoredNotificationIds(map) {
  writeSync(KEYS.NOTIFICATION_IDS, map);
}

export function saveLocalThumbnail(entryId, dataUrl) {
  if (!entryId || !dataUrl) return;
  const images = readSync(KEYS.LOCAL_IMAGES, {});
  const keys = Object.keys(images);
  if (keys.length > 40) {
    delete images[keys[0]];
  }
  images[entryId] = dataUrl;
  writeSync(KEYS.LOCAL_IMAGES, images);
}

export function getLocalThumbnail(entryId) {
  if (!entryId) return null;
  const images = readSync(KEYS.LOCAL_IMAGES, {});
  return images[entryId] || null;
}

export function removeLocalThumbnail(entryId) {
  if (!entryId) return;
  const images = readSync(KEYS.LOCAL_IMAGES, {});
  if (images[entryId]) {
    delete images[entryId];
    writeSync(KEYS.LOCAL_IMAGES, images);
  }
}

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export function getLocalUserProfile() {
  const user = readSync(KEYS.LOCAL_USER, null);
  if (!user) return null;
  if (user.sessionExpiresAt && Date.now() > Number(user.sessionExpiresAt)) {
    writeSync(KEYS.LOCAL_USER, null);
    return null;
  }
  return user;
}

export function saveLocalUserProfile(user) {
  if (!user) {
    writeSync(KEYS.LOCAL_USER, null);
    return null;
  }
  const now = Date.now();
  const withExpiry = {
    ...user,
    loggedInAt: user.loggedInAt || new Date(now).toISOString(),
    sessionExpiresAt: user.sessionExpiresAt || now + SESSION_DURATION_MS
  };
  writeSync(KEYS.LOCAL_USER, withExpiry);
  return withExpiry;
}

export function registerLocalAccount(email, password, displayName) {
  const accounts = readSync(KEYS.LOCAL_ACCOUNTS, {});
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required.');
  }
  const account = {
    uid: `local_${normalizedEmail.replace(/[^a-z0-9]/g, '_')}`,
    email: normalizedEmail,
    displayName: displayName?.trim() || normalizedEmail.split('@')[0],
    passwordHash: btoa(unescape(encodeURIComponent(password))),
    createdAt: new Date().toISOString()
  };
  accounts[normalizedEmail] = account;
  writeSync(KEYS.LOCAL_ACCOUNTS, accounts);
  return saveLocalUserProfile({
    uid: account.uid,
    email: account.email,
    displayName: account.displayName,
    isLocalOnly: true
  });
}

export function authenticateLocalAccount(email, password) {
  const accounts = readSync(KEYS.LOCAL_ACCOUNTS, {});
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const existing = accounts[normalizedEmail];
  const encodedPass = btoa(unescape(encodeURIComponent(password)));

  if (!existing) {
    return registerLocalAccount(normalizedEmail, password, normalizedEmail.split('@')[0]);
  }
  if (existing.passwordHash !== encodedPass) {
    throw new Error('Incorrect password for this account.');
  }
  return saveLocalUserProfile({
    uid: existing.uid,
    email: existing.email,
    displayName: existing.displayName,
    isLocalOnly: true
  });
}

export function exportAllLocalData() {
  return {
    app: 'CROWN HABIT',
    exportedAt: new Date().toISOString(),
    settings: getStoredSettings(),
    routines: getStoredRoutines(),
    dailyRecords: getAllStoredDailyRecords()
  };
}

export function clearAllLocalData() {
  Object.values(KEYS).forEach((key) => {
    window.localStorage.removeItem(key);
    Preferences.remove({ key }).catch(() => {});
  });
}

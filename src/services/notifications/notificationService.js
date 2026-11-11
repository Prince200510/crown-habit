import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import {
  getStoredNotificationIds,
  saveStoredNotificationIds,
  getStoredSettings
} from '../localStorage/storageService';
import { shouldRoutineRunOnDate } from '../../utils/dateUtils';

function hashRoutineNotificationIds(routineId) {
  let hash = 0;
  const str = String(routineId);
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0x0fffffff;
  }
  const primaryId = (hash % 400000) * 2 + 1000;
  const followUpId = primaryId + 1;
  return { primaryId, followUpId };
}

function buildPrimaryMessage(routine) {
  const lower = (routine.name || '').toLowerCase();
  if (lower.includes('oats') || lower.includes('breakfast')) {
    return `Breakfast time! Your ${routine.name.toLowerCase()} are scheduled.`;
  }
  if (lower.includes('lunch')) {
    return `Lunch time! Your ${routine.name.toLowerCase()} is scheduled.`;
  }
  if (lower.includes('dinner')) {
    return `Dinner time! Your ${routine.name.toLowerCase()} is scheduled.`;
  }
  if (lower.includes('water')) {
    return `Hydration reminder! Time to ${routine.name.toLowerCase()}.`;
  }
  return `Scheduled routine: ${routine.name} (${routine.scheduledTime}).`;
}

function buildFollowUpMessage(routine) {
  const lower = (routine.name || '').toLowerCase();
  if (lower.includes('oats') || lower.includes('breakfast')) {
    return "You haven't marked your breakfast as completed yet.";
  }
  return `You haven't marked "${routine.name}" as completed yet.`;
}

export async function requestNotificationPermissions() {
  try {
    if (Capacitor.isNativePlatform()) {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const requested = await LocalNotifications.requestPermissions();
        return requested.display === 'granted';
      }
      return true;
    }

    if ('Notification' in window) {
      if (Notification.permission === 'granted') return true;
      const status = await Notification.requestPermission();
      return status === 'granted';
    }
    return false;
  } catch {
    return false;
  }
}

export async function checkExactAlarmSetting() {
  try {
    if (Capacitor.isNativePlatform() && typeof LocalNotifications.checkExactNotificationSetting === 'function') {
      const res = await LocalNotifications.checkExactNotificationSetting();
      return res?.exact_alarm || 'granted';
    }
    return 'web_supported';
  } catch {
    return 'unknown';
  }
}

export async function cancelRoutineNotifications(routineId) {
  const map = getStoredNotificationIds();
  const ids = map[routineId] || hashRoutineNotificationIds(routineId);
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: ids.primaryId }, { id: ids.followUpId }]
      });
    } catch {
      void 0;
    }
  }
  delete map[routineId];
  saveStoredNotificationIds(map);
}

export async function cancelFollowUpNotification(routineId) {
  const map = getStoredNotificationIds();
  const ids = map[routineId] || hashRoutineNotificationIds(routineId);
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: ids.followUpId }]
      });
    } catch {
      void 0;
    }
  }
}

export async function reconcileDailyNotifications(routines = [], dailyRecord = null, dateKey = '') {
  const settings = getStoredSettings();
  if (!settings.notificationsEnabled) {
    const existingMap = getStoredNotificationIds();
    const allIds = [];
    Object.values(existingMap).forEach((pair) => {
      if (pair?.primaryId) allIds.push({ id: pair.primaryId });
      if (pair?.followUpId) allIds.push({ id: pair.followUpId });
    });
    if (allIds.length > 0) {
      try {
        await LocalNotifications.cancel({ notifications: allIds });
      } catch {
        void 0;
      }
    }
    saveStoredNotificationIds({});
    return { scheduledCount: 0 };
  }

  const now = new Date();
  const notificationsToSchedule = [];
  const nextIdMap = {};
  const statuses = dailyRecord?.habitStatuses || {};

  for (const routine of routines) {
    const { primaryId, followUpId } = hashRoutineNotificationIds(routine.id);
    await cancelRoutineNotifications(routine.id);

    if (!routine.active || !routine.reminderEnabled) continue;
    if (dateKey && !shouldRoutineRunOnDate(routine, dateKey)) continue;

    const [hStr, mStr] = (routine.scheduledTime || '08:00').split(':');
    const hour = Number(hStr) || 8;
    const minute = Number(mStr) || 0;

    const primaryDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
      0,
      0
    );

    const currentStatus = statuses[routine.id]?.status || 'pending';
    const isCompletedOrSkipped = currentStatus === 'completed' || currentStatus === 'skipped';

    if (primaryDate <= now || isCompletedOrSkipped) {
      const tomorrowPrimary = new Date(primaryDate.getTime() + 24 * 60 * 60 * 1000);
      notificationsToSchedule.push({
        id: primaryId,
        title: `CROWN HABIT • ${routine.name}`,
        body: buildPrimaryMessage(routine),
        smallIcon: 'ic_stat_crown',
        iconColor: '#173B68',
        schedule: { at: tomorrowPrimary, allowWhileIdle: true },
        extra: { routineId: routine.id, type: 'primary' }
      });

      if (routine.followUpEnabled) {
        const followUpMins = Number(routine.followUpMinutes || settings.followUpMinutes || 15);
        const tomorrowFollowUp = new Date(tomorrowPrimary.getTime() + followUpMins * 60 * 1000);
        notificationsToSchedule.push({
          id: followUpId,
          title: `Follow-up • ${routine.name}`,
          body: buildFollowUpMessage(routine),
          smallIcon: 'ic_stat_crown',
          iconColor: '#173B68',
          schedule: { at: tomorrowFollowUp, allowWhileIdle: true },
          extra: { routineId: routine.id, type: 'followup' }
        });
      }
    } else {
      notificationsToSchedule.push({
        id: primaryId,
        title: `CROWN HABIT • ${routine.name}`,
        body: buildPrimaryMessage(routine),
        smallIcon: 'ic_stat_crown',
        iconColor: '#173B68',
        schedule: { at: primaryDate, allowWhileIdle: true },
        extra: { routineId: routine.id, type: 'primary' }
      });

      if (routine.followUpEnabled) {
        const followUpMins = Number(routine.followUpMinutes || settings.followUpMinutes || 15);
        const followUpDate = new Date(primaryDate.getTime() + followUpMins * 60 * 1000);
        notificationsToSchedule.push({
          id: followUpId,
          title: `Follow-up • ${routine.name}`,
          body: buildFollowUpMessage(routine),
          smallIcon: 'ic_stat_crown',
          iconColor: '#173B68',
          schedule: { at: followUpDate, allowWhileIdle: true },
          extra: { routineId: routine.id, type: 'followup' }
        });
      }
    }

    nextIdMap[routine.id] = {
      primaryId,
      followUpId,
      scheduledTime: routine.scheduledTime,
      routineName: routine.name
    };
  }

  if (notificationsToSchedule.length > 0 && Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule
      });
    } catch {
      void 0;
    }
  }

  saveStoredNotificationIds(nextIdMap);
  return { scheduledCount: notificationsToSchedule.length, map: nextIdMap };
}

export async function sendTestNotification() {
  const granted = await requestNotificationPermissions();
  if (!granted) {
    throw new Error('Notification permission was not granted.');
  }

  const fireAt = new Date(Date.now() + 3000);
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 999001,
        title: 'CROWN HABIT Reminder Active',
        body: 'Breakfast time! Your morning oats are scheduled. (Test Notification)',
        smallIcon: 'ic_stat_crown',
        iconColor: '#173B68',
        schedule: { at: fireAt, allowWhileIdle: true }
      }
    ]
  });
  return true;
}

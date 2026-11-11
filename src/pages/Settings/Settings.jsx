import React, { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Sparkles,
  Database,
  Download,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { checkGeminiProxyStatus } from '../../services/gemini/geminiService';
import {
  requestNotificationPermissions,
  checkExactAlarmSetting,
  sendTestNotification
} from '../../services/notifications/notificationService';
import {
  exportAllLocalData,
  clearAllLocalData,
  getStoredNotificationIds
} from '../../services/localStorage/storageService';
import {
  getFirebaseRuntimeConfig,
  saveCustomFirebaseConfig,
  isFirebaseConfigured
} from '../../services/firebase/firebaseConfig';

export default function Settings() {
  const {
    user,
    settings,
    updateSettings,
    syncStatus,
    syncError,
    flushSyncQueue,
    signInUser,
    signUpUser,
    signOutUser
  } = useApp();

  const [displayName, setDisplayName] = useState(settings.displayName || 'Crown User');
  const [timezone, setTimezone] = useState(settings.timezone || 'Asia/Kolkata');
  const [resetTime, setResetTime] = useState(settings.resetTime || '00:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    settings.notificationsEnabled !== false
  );
  const [followUpMinutes, setFollowUpMinutes] = useState(settings.followUpMinutes || 15);
  const [aiProxyUrl, setAiProxyUrl] = useState(
    settings.aiProxyUrl || '/api/analyze-meal'
  );
  const [calorieGoal, setCalorieGoal] = useState(settings.nutritionGoals?.calories || 2000);
  const [proteinGoal, setProteinGoal] = useState(settings.nutritionGoals?.protein || 75);
  const [outsideLimit, setOutsideLimit] = useState(
    settings.nutritionGoals?.outsideFoodLimitKcal || 400
  );
  const [weightKg, setWeightKg] = useState(settings.nutritionGoals?.weightKg || 70);
  const [dailyStepGoal, setDailyStepGoal] = useState(
    settings.nutritionGoals?.dailyStepGoal || 6000
  );

  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authFeedback, setAuthFeedback] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [fbConfig, setFbConfig] = useState(() => getFirebaseRuntimeConfig());
  const [showFbSetup, setShowFbSetup] = useState(false);

  const [geminiStatus, setGeminiStatus] = useState({
    configured: false,
    message: 'Checking...'
  });
  const [exactAlarmStatus, setExactAlarmStatus] = useState('checking');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    checkGeminiProxyStatus().then(setGeminiStatus);
    checkExactAlarmSetting().then(setExactAlarmStatus);
  }, []);

  const handleSaveGeneralSettings = async (e) => {
    e.preventDefault();
    await updateSettings({
      displayName: displayName.trim() || 'Crown User',
      timezone,
      resetTime,
      notificationsEnabled,
      followUpMinutes: Number(followUpMinutes) || 15,
      aiProxyUrl: aiProxyUrl.trim() || '/api/analyze-meal',
      nutritionGoals: {
        ...settings.nutritionGoals,
        calories: Number(calorieGoal) || 2000,
        protein: Number(proteinGoal) || 75,
        outsideFoodLimitKcal: Number(outsideLimit) || 400,
        weightKg: Number(weightKg) || 70,
        dailyStepGoal: Number(dailyStepGoal) || 6000
      }
    });
    const nextAiStatus = await checkGeminiProxyStatus();
    setGeminiStatus(nextAiStatus);
    setStatusMessage('Settings saved and notifications reconciled.');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthFeedback('');
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await signInUser(email.trim(), password);
        setAuthFeedback('Signed in to Firebase successfully.');
      } else {
        await signUpUser(email.trim(), password, displayName);
        setAuthFeedback('Account created and synced with Firestore.');
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthFeedback(err.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveFirebaseConfig = (e) => {
    e.preventDefault();
    saveCustomFirebaseConfig(fbConfig);
    window.location.reload();
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      setStatusMessage('Test notification scheduled (fires in 3 seconds).');
    } catch (err) {
      setStatusMessage(err.message || 'Could not schedule test notification.');
    }
  };

  const handleExportData = () => {
    const data = exportAllLocalData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crown-habit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetLocalDeviceData = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all locally cached records on this device? Cloud Firestore data will remain untouched unless you delete it from Firebase.'
      )
    ) {
      clearAllLocalData();
      window.location.reload();
    }
  };

  const scheduledNotifCount = Object.keys(getStoredNotificationIds()).length;

  return (
    <div className="space-y-5">
      <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card">
        <h1 className="text-xl font-bold text-crown-text">Settings & Preferences</h1>
        <p className="text-xs text-crown-muted mt-0.5">
          Configure timezone, daily reset, Android reminders, Gemini AI proxy, and Firebase Spark synchronization.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-crown-teal flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <form
          onSubmit={handleSaveGeneralSettings}
          className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card space-y-4"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-crown-border">
            <User className="w-4 h-4 text-crown-blue" />
            <h2 className="text-sm font-bold text-crown-text">
              Profile, Timezone & Daily Reset
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-crown-text mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-crown-text mb-1">
                Default Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Asia/Singapore">Asia/Singapore</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-crown-text mb-1">
                Daily Reset Time
              </label>
              <input
                type="time"
                value={resetTime}
                onChange={(e) => setResetTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-crown-border">
            <div className="text-xs font-bold text-crown-text mb-2">
              Daily Nutrition Display Reference
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] text-crown-muted mb-1">
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text"
                />
              </div>
              <div>
                <label className="block text-[11px] text-crown-muted mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={(e) => setProteinGoal(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text"
                />
              </div>
              <div>
                <label className="block text-[11px] text-crown-muted mb-1">
                  Outside Limit (kcal)
                </label>
                <input
                  type="number"
                  value={outsideLimit}
                  onChange={(e) => setOutsideLimit(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text"
                />
              </div>
              <div>
                <label className="block text-[11px] text-crown-muted mb-1">
                  Body Weight (kg)
                </label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text"
                />
              </div>
              <div>
                <label className="block text-[11px] text-crown-muted mb-1">
                  Daily Step Goal
                </label>
                <input
                  type="number"
                  value={dailyStepGoal}
                  onChange={(e) => setDailyStepGoal(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-crown-border space-y-2.5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-crown-blue" />
              <span className="text-xs font-bold text-crown-text">
                Android Local Notifications
              </span>
            </div>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-crown-input border border-crown-border cursor-pointer">
              <span className="text-xs font-medium text-crown-text">
                Enable Scheduled Habit Reminders
              </span>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 accent-crown-blue"
              />
            </label>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-crown-muted">
                Default Follow-up Reminder Delay (minutes)
              </span>
              <input
                type="number"
                min="5"
                max="120"
                value={followUpMinutes}
                onChange={(e) => setFollowUpMinutes(e.target.value)}
                className="w-24 px-2.5 py-1.5 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={requestNotificationPermissions}
                className="px-3 py-1.5 rounded-lg bg-crown-input border border-crown-border text-xs font-semibold text-crown-navy hover:bg-slate-100"
              >
                Request Permission
              </button>
              <button
                type="button"
                onClick={handleTestNotification}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-crown-blue text-xs font-semibold hover:bg-blue-100"
              >
                Send Test Reminder
              </button>
              <span className="text-[11px] text-crown-muted">
                Active schedules: {scheduledNotifCount} • Exact alarm: {exactAlarmStatus}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-crown-text">
              <span className="font-bold">Android Battery Note:</span> Aggressive OEM battery savers (Xiaomi MIUI, Samsung OneUI, OnePlus OxygenOS) can delay background alarms. Set CROWN HABIT to &quot;Unrestricted&quot; battery usage in Android App Info for exact minute-level reminders.
            </div>
          </div>

          <div className="pt-2 border-t border-crown-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-crown-text flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-crown-blue" />
                Gemini AI Proxy Endpoint
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  geminiStatus.configured ? 'text-crown-teal' : 'text-crown-warning'
                }`}
              >
                {geminiStatus.message}
              </span>
            </div>
            <input
              type="text"
              value={aiProxyUrl}
              onChange={(e) => setAiProxyUrl(e.target.value)}
              placeholder="/api/analyze-meal or https://your-proxy.vercel.app/api/analyze-meal"
              className="w-full px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-crown-blue text-white text-xs font-bold shadow-xs hover:opacity-95"
          >
            Save Preferences
          </button>
        </form>

        <div className="space-y-5">
          <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-crown-border">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-crown-blue" />
                <h2 className="text-sm font-bold text-crown-text">
                  Firebase Account & Cloud Sync
                </h2>
              </div>
              <span className="text-xs font-semibold text-crown-navy">
                Status: {syncStatus}
              </span>
            </div>

            {syncError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-crown-error">
                {syncError}
              </div>
            )}

            {user ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs">
                  <div className="font-bold text-crown-teal">
                    Signed in as {user.displayName}
                  </div>
                  <div className="text-crown-muted mt-0.5">{user.email}</div>
                  {user.sessionExpiresAt && (
                    <div className="text-[11px] text-crown-navy font-medium mt-1">
                      30-Day Session Active until{' '}
                      {new Date(Number(user.sessionExpiresAt)).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}{' '}
                      ({Math.max(1, Math.ceil((Number(user.sessionExpiresAt) - Date.now()) / (1000 * 60 * 60 * 24)))} days remaining)
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!user.isLocalOnly && (
                    <button
                      type="button"
                      onClick={() => flushSyncQueue()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-crown-blue text-white text-xs font-semibold"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Sync Now
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={signOutUser}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-crown-input border border-crown-border text-xs font-semibold text-crown-text hover:bg-red-50 hover:text-crown-error"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <div className="text-xs text-crown-muted">
                  Sign in with Firebase Authentication to back up your compact daily records and routines across devices.
                </div>

                {authFeedback && (
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-crown-navy">
                    {authFeedback}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password (min 6 chars)"
                    className="px-3 py-2 rounded-lg bg-crown-input border border-crown-border text-xs text-crown-text"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="px-4 py-2 rounded-lg bg-crown-blue text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {authLoading
                      ? 'Connecting...'
                      : authMode === 'login'
                      ? 'Sign In'
                      : 'Create Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAuthMode((m) => (m === 'login' ? 'register' : 'login'))
                    }
                    className="text-xs font-semibold text-crown-blue hover:underline"
                  >
                    {authMode === 'login'
                      ? 'Need an account? Register'
                      : 'Have an account? Sign In'}
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-crown-border">
              <button
                type="button"
                onClick={() => setShowFbSetup((prev) => !prev)}
                className="text-xs font-semibold text-crown-navy hover:underline"
              >
                {isFirebaseConfigured()
                  ? 'Update Firebase Project Keys'
                  : '+ Configure Firebase Project Keys on Device'}
              </button>

              {showFbSetup && (
                <form onSubmit={handleSaveFirebaseConfig} className="mt-3 space-y-2">
                  <input
                    type="text"
                    placeholder="apiKey"
                    value={fbConfig.apiKey}
                    onChange={(e) =>
                      setFbConfig({ ...fbConfig, apiKey: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-crown-input border border-crown-border text-xs"
                  />
                  <input
                    type="text"
                    placeholder="authDomain (e.g. your-app.firebaseapp.com)"
                    value={fbConfig.authDomain}
                    onChange={(e) =>
                      setFbConfig({ ...fbConfig, authDomain: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-crown-input border border-crown-border text-xs"
                  />
                  <input
                    type="text"
                    placeholder="projectId"
                    value={fbConfig.projectId}
                    onChange={(e) =>
                      setFbConfig({ ...fbConfig, projectId: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-crown-input border border-crown-border text-xs"
                  />
                  <input
                    type="text"
                    placeholder="appId"
                    value={fbConfig.appId}
                    onChange={(e) =>
                      setFbConfig({ ...fbConfig, appId: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-crown-input border border-crown-border text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-crown-navy text-white text-xs font-semibold"
                  >
                    Save Firebase Config & Reload
                  </button>
                </form>
              )}
            </div>

            <div className="p-3 rounded-lg bg-crown-input border border-crown-border text-[11px] text-crown-muted space-y-1">
              <div className="font-bold text-crown-text flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-crown-teal" />
                Firebase Spark Free-Tier Quotas & Cost Protection
              </div>
              <p>
                Firestore Spark limits: 1 GiB storage, 50,000 document reads/day, 20,000 writes/day, 20,000 deletes/day. CROWN HABIT stores one compact JSON document per day, never uploads photos to cloud storage, avoids continuous listeners, and calculates reports locally.
              </p>
            </div>
          </div>

          <div className="bg-crown-card border border-crown-border rounded-xl p-5 shadow-card space-y-3">
            <h2 className="text-sm font-bold text-crown-text">
              Data Export & Account Deletion Guidance
            </h2>
            <p className="text-xs text-crown-muted">
              Export your complete routine templates and daily history as a portable JSON backup at any time.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportData}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-crown-input border border-crown-border text-xs font-semibold text-crown-navy hover:bg-slate-100"
              >
                <Download className="w-3.5 h-3.5 text-crown-blue" />
                Export JSON Backup
              </button>
              <button
                type="button"
                onClick={handleResetLocalDeviceData}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-crown-error hover:bg-red-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Local Device Cache
              </button>
            </div>
            <div className="text-[11px] text-crown-muted pt-1">
              To permanently delete your cloud account and Firestore documents: sign in above, export any desired backup, delete your `users/{'{userId}'}` collection from the Firebase Console or request account deletion, and clear local device data.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

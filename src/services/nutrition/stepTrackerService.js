import { Capacitor, registerPlugin } from '@capacitor/core';

const NativeStepCounter = registerPlugin('StepCounter');

const STEP_THRESHOLD = 11.75;
const MIN_STEP_INTERVAL_MS = 330;

let isTracking = false;
let stepListenerCleanup = null;
let lastStepTimestamp = 0;

export function calculateWalkingMetrics({
  steps = 0,
  activeSeconds = 0,
  weightKg = 70,
  heightCm = 172,
  foodCalories = 0,
  calorieGoal = 2000
}) {
  const cleanSteps = Math.max(0, Math.round(Number(steps) || 0));
  const estimatedWalkSeconds = Math.round((cleanSteps / 100) * 60);
  const cleanSeconds = Math.max(cleanSteps > 0 ? estimatedWalkSeconds : 0, Math.round(Number(activeSeconds) || 0));
  const cleanWeight = Math.max(30, Number(weightKg) || 70);
  const cleanHeight = Math.max(120, Number(heightCm) || 172);

  const strideMeters = (cleanHeight * 0.415) / 100;
  const distanceKm = Math.round(((cleanSteps * strideMeters) / 1000) * 100) / 100;

  const kcalPerStep = 0.00063 * cleanWeight;
  const stepBasedKcal = cleanSteps * kcalPerStep;

  const caloriesBurned = Math.round(stepBasedKcal);
  const netCalories = Math.round((Number(foodCalories) || 0) - caloriesBurned);
  const calorieDeficit = Math.round((Number(calorieGoal) || 2000) - netCalories);

  return {
    steps: cleanSteps,
    activeSeconds: cleanSeconds,
    activeMinutes: Math.floor(cleanSeconds / 60),
    distanceKm,
    caloriesBurned,
    netCalories,
    calorieDeficit
  };
}

export function formatDurationClock(totalSeconds = 0) {
  const secs = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins} min`;
}

export async function startAlwaysOnStepSensor({ onAbsoluteSteps, onIncrementSteps }) {
  if (isTracking) return { started: true };
  isTracking = true;

  const cleanups = [];
  let hardwareActive = false;

  if (Capacitor.isNativePlatform()) {
    try {
      const status = await NativeStepCounter.startTracking();
      if (status?.started) {
        hardwareActive = true;
        const counterHandle = await NativeStepCounter.addListener('stepEvent', (data) => {
          const todaySteps = Number(data?.todaySteps) || 0;
          if (onAbsoluteSteps) {
            onAbsoluteSteps(todaySteps);
          }
        });
        const detectorHandle = await NativeStepCounter.addListener('stepDetectorEvent', (data) => {
          if (onIncrementSteps) {
            onIncrementSteps(Number(data?.stepIncrement) || 1);
          }
        });
        cleanups.push(() => {
          counterHandle?.remove?.();
          detectorHandle?.remove?.();
        });
      }
    } catch {
      hardwareActive = false;
    }
  }

  if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
    const motionHandler = (event) => {
      if (hardwareActive) return;
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const x = Number(acc.x) || 0;
      const y = Number(acc.y) || 0;
      const z = Number(acc.z) || 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (magnitude > STEP_THRESHOLD && now - lastStepTimestamp > MIN_STEP_INTERVAL_MS) {
        lastStepTimestamp = now;
        if (onIncrementSteps) {
          onIncrementSteps(1);
        }
      }
    };

    window.addEventListener('devicemotion', motionHandler, { passive: true });
    cleanups.push(() => window.removeEventListener('devicemotion', motionHandler));
  }

  stepListenerCleanup = () => {
    cleanups.forEach((fn) => {
      try {
        fn();
      } catch {
        void 0;
      }
    });
  };

  return {
    started: true,
    mode: hardwareActive ? 'android_hardware_sensor' : 'accelerometer_sensor'
  };
}

export async function stopAlwaysOnStepSensor() {
  isTracking = false;
  if (stepListenerCleanup) {
    stepListenerCleanup();
    stepListenerCleanup = null;
  }
}

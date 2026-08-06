import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STEPS_PREFIX = 'runapp_steps_';

function todayKey() {
  return STEPS_PREFIX + new Date().toISOString().slice(0, 10);
}

export async function requestStepPermission() {
  try {
    const { status } = await Pedometer.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    return false;
  }
}

// Best-effort total for today. On devices/platforms that support querying
// step history (mainly iOS), this reads the real all-day total even if the
// app wasn't open. Otherwise it falls back to whatever we've accumulated
// locally from watchStepCount while the app was open.
export async function getTodaySteps() {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (isAvailable) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const result = await Pedometer.getStepCountAsync(start, new Date());
      if (result && typeof result.steps === 'number') return result.steps;
    }
  } catch (e) {
    // getStepCountAsync isn't supported on this device — fall through
  }
  try {
    const raw = await AsyncStorage.getItem(todayKey());
    return raw ? parseInt(raw, 10) : 0;
  } catch (e) {
    return 0;
  }
}

let subscription = null;
let baseline = 0;

// Keeps today's step count updating live while the screen is open, and
// persists progress locally so it isn't lost if getStepCountAsync isn't
// available on this device.
export async function startLiveStepTracking(onUpdate) {
  const isAvailable = await Pedometer.isAvailableAsync();
  if (!isAvailable) return;

  const raw = await AsyncStorage.getItem(todayKey());
  baseline = raw ? parseInt(raw, 10) : 0;

  subscription = Pedometer.watchStepCount((result) => {
    const total = baseline + result.steps;
    AsyncStorage.setItem(todayKey(), String(total)).catch(() => {});
    onUpdate(total);
  });
}

export function stopLiveStepTracking() {
  if (subscription) {
    subscription.remove();
    subscription = null;
  }
}

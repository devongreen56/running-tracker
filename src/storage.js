import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'runapp_profile';
const HISTORY_KEY = 'runapp_history';
const INPROGRESS_KEY = 'runapp_inprogress';

export const defaultProfile = {
  weight: 67,
  height: 174,
  age: 50,
  gender: 'm',
  goalDist: 5,
  goalPace: '8:00',
};

export async function getProfile() {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : defaultProfile;
  } catch (e) {
    return defaultProfile;
  }
}

export async function saveProfile(profile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getHistory() {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function addRun(record) {
  const history = await getHistory();
  history.push(record);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

export async function deleteRun(date) {
  const history = await getHistory();
  const filtered = history.filter((r) => r.date !== date);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  return filtered;
}

// scope: 'week' | 'month' | 'all' — removes matching records, keeps the rest
export async function resetHistory(scope) {
  if (scope === 'all') {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([]));
    return [];
  }

  const now = new Date();
  let rangeStart;
  if (scope === 'week') {
    rangeStart = new Date(now);
    rangeStart.setDate(now.getDate() - now.getDay());
    rangeStart.setHours(0, 0, 0, 0);
  } else if (scope === 'month') {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else {
    return getHistory();
  }

  const history = await getHistory();
  const filtered = history.filter((r) => new Date(r.date) < rangeStart);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  return filtered;
}

// Wipes history: 'all' clears everything, 'week'/'month' keeps everything before that period.
export async function clearHistory() {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

// Periodically-saved snapshot of a run in progress, so it can be recovered
// if the app is force-closed before the user taps "종료".
export async function saveInProgress(snapshot) {
  try {
    await AsyncStorage.setItem(INPROGRESS_KEY, JSON.stringify(snapshot));
  } catch (e) {}
}

export async function getInProgress() {
  try {
    const raw = await AsyncStorage.getItem(INPROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function clearInProgress() {
  try {
    await AsyncStorage.removeItem(INPROGRESS_KEY);
  } catch (e) {}
}

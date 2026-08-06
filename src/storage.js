import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'runapp_profile';
const HISTORY_KEY = 'runapp_history';

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

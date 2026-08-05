import * as TaskManager from 'expo-task-manager';
import { haversineKm } from './utils';

export const LOCATION_TASK_NAME = 'run-location-task';

// Module-level state so the background task and the screen share the same data
// even if the screen component unmounts/remounts while backgrounded.
export const runData = {
  active: false,
  distanceKm: 0,
  lastCoord: null,
  splits: [],
  startTime: null,
  pausedAt: null,
  pausedTotalMs: 0,
};

export function resetRunData() {
  runData.active = true;
  runData.distanceKm = 0;
  runData.lastCoord = null;
  runData.splits = [];
  runData.startTime = Date.now();
  runData.pausedAt = null;
  runData.pausedTotalMs = 0;
}

export function getElapsedSeconds() {
  if (!runData.startTime) return 0;
  const pausedMs = runData.pausedTotalMs + (runData.pausedAt ? Date.now() - runData.pausedAt : 0);
  return Math.max(0, (Date.now() - runData.startTime - pausedMs) / 1000);
}

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error || !data || !runData.active || runData.pausedAt) return;
  const { locations } = data;
  locations.forEach((loc) => {
    const { latitude, longitude } = loc.coords;
    if (runData.lastCoord) {
      const d = haversineKm(runData.lastCoord.lat, runData.lastCoord.lon, latitude, longitude);
      // ignore GPS jumps larger than 100m between updates (signal noise, not real movement)
      if (d < 0.1) {
        runData.distanceKm += d;
        const elapsedSec = getElapsedSeconds();
        if (Math.floor(runData.distanceKm) > runData.splits.length) {
          runData.splits.push(elapsedSec / runData.distanceKm / 60);
        }
      }
    }
    runData.lastCoord = { lat: latitude, lon: longitude };
  });
});

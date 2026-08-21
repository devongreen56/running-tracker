import * as TaskManager from 'expo-task-manager';
import { haversineKm } from './utils';
import { saveInProgress } from './storage';

export const LOCATION_TASK_NAME = 'run-location-task';

// Module-level state so the background task and the screen share the same data
// even if the screen component unmounts/remounts while backgrounded.
export const runData = {
  active: false,
  distanceKm: 0,
  lastCoord: null,
  lastTimestamp: null,
  splits: [],
  path: [], // full route, used to draw the map afterwards
  startTime: null,
  pausedAt: null,
  pausedTotalMs: 0,
};

export function resetRunData() {
  runData.active = true;
  runData.distanceKm = 0;
  runData.lastCoord = null;
  runData.lastTimestamp = null;
  runData.splits = [];
  runData.path = [];
  runData.startTime = Date.now();
  runData.pausedAt = null;
  runData.pausedTotalMs = 0;
}

export function getElapsedSeconds() {
  if (!runData.startTime) return 0;
  const pausedMs = runData.pausedTotalMs + (runData.pausedAt ? Date.now() - runData.pausedAt : 0);
  return Math.max(0, (Date.now() - runData.startTime - pausedMs) / 1000);
}

// GPS accuracy/noise filtering thresholds
const MAX_ACCEPTABLE_ACCURACY_M = 25; // ignore fixes worse than this (meters)
const MIN_MOVEMENT_KM = 0.003; // ignore jitter smaller than ~3m
const MAX_JUMP_KM = 0.1; // ignore jumps larger than 100m between updates (signal glitch)
const MAX_REALISTIC_SPEED_MS = 8; // ~28.8 km/h, generous cap for a sprinting recreational runner

let lastAutosaveTs = 0;

async function autosaveProgress() {
  const now = Date.now();
  if (now - lastAutosaveTs < 5000) return; // throttle to once every 5s
  lastAutosaveTs = now;
  await saveInProgress({
    distanceKm: runData.distanceKm,
    path: runData.path,
    splits: runData.splits,
    startTime: runData.startTime,
    pausedTotalMs: runData.pausedTotalMs,
    pausedAt: runData.pausedAt,
    savedAt: now,
  });
}

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error || !data || !runData.active || runData.pausedAt) return;
  const { locations } = data;

  locations.forEach((loc) => {
    const { latitude, longitude, accuracy } = loc.coords;
    const timestamp = loc.timestamp || Date.now();

    // Skip low-quality fixes (large accuracy radius = unreliable position)
    if (typeof accuracy === 'number' && accuracy > MAX_ACCEPTABLE_ACCURACY_M) {
      return;
    }

    if (runData.lastCoord) {
      const d = haversineKm(runData.lastCoord.lat, runData.lastCoord.lon, latitude, longitude);
      const dtSec = runData.lastTimestamp ? Math.max(0.5, (timestamp - runData.lastTimestamp) / 1000) : 1;
      const impliedSpeed = (d * 1000) / dtSec; // m/s

      // Ignore GPS glitches: unrealistic jump distance or unrealistic speed
      if (d >= MAX_JUMP_KM || impliedSpeed > MAX_REALISTIC_SPEED_MS) {
        runData.lastTimestamp = timestamp;
        return; // don't update lastCoord either — treat as a bad fix, wait for the next one
      }

      // Ignore tiny jitter (device sitting still, signal wobble) — but still
      // move the reference point so error doesn't compound.
      if (d < MIN_MOVEMENT_KM) {
        runData.lastCoord = { lat: latitude, lon: longitude };
        runData.lastTimestamp = timestamp;
        return;
      }

      runData.distanceKm += d;
      runData.path.push({ latitude, longitude });
      const elapsedSec = getElapsedSeconds();
      if (Math.floor(runData.distanceKm) > runData.splits.length) {
        runData.splits.push(elapsedSec / runData.distanceKm / 60);
      }
    } else {
      // first point of the run
      runData.path.push({ latitude, longitude });
    }
    runData.lastCoord = { lat: latitude, lon: longitude };
    runData.lastTimestamp = timestamp;
  });

  autosaveProgress();
});

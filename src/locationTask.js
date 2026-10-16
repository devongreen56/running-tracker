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
  photos: [], // { uri, latitude, longitude, timestamp }
  startTime: null,
  pausedAt: null,
  pausedTotalMs: 0,
  runKm: 0,
  walkKm: 0,
  runSec: 0,
  walkSec: 0,
  win: [], // recent counted points {t, km} for smoothed speed
};

export function resetRunData() {
  runData.active = true;
  runData.distanceKm = 0;
  runData.lastCoord = null;
  runData.lastTimestamp = null;
  runData.splits = [];
  runData.path = [];
  runData.photos = [];
  runData.startTime = Date.now();
  runData.pausedAt = null;
  runData.pausedTotalMs = 0;
  runData.runKm = 0;
  runData.walkKm = 0;
  runData.runSec = 0;
  runData.walkSec = 0;
  runData.win = [];
}

export function getElapsedSeconds() {
  if (!runData.startTime) return 0;
  const pausedMs = runData.pausedTotalMs + (runData.pausedAt ? Date.now() - runData.pausedAt : 0);
  return Math.max(0, (Date.now() - runData.startTime - pausedMs) / 1000);
}

// GPS accuracy/noise filtering thresholds
const MAX_ACCEPTABLE_ACCURACY_M = 40; // ignore fixes worse than this (meters)
const MIN_MOVEMENT_KM = 0.003; // displacement from anchor below ~3m counts as jitter
// Speed (m/s, smoothed over ~10s) at or above this counts as running, below as walking.
// 2.0 m/s = 7.2 km/h (about 8:20 min/km).
const RUN_SPEED_MS = 2.0;
const WINDOW_MS = 10000;
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
    photos: runData.photos,
    startTime: runData.startTime,
    pausedTotalMs: runData.pausedTotalMs,
    pausedAt: runData.pausedAt,
    runKm: runData.runKm,
    walkKm: runData.walkKm,
    runSec: runData.runSec,
    walkSec: runData.walkSec,
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
      // lastCoord/lastTimestamp = "anchor": the last point that was actually counted.
      const d = haversineKm(runData.lastCoord.lat, runData.lastCoord.lon, latitude, longitude);
      const dtSec = Math.max(0.5, (timestamp - runData.lastTimestamp) / 1000);
      const impliedSpeed = (d * 1000) / dtSec; // m/s measured from the anchor

      // Unrealistic speed from the anchor = GPS glitch. Keep the anchor and its
      // timestamp, so after a gap the elapsed time grows and a real position passes.
      if (impliedSpeed > MAX_REALISTIC_SPEED_MS) return;

      // Jitter: do NOT move the anchor. Small steps accumulate until the total
      // displacement exceeds the threshold (previously every ~2.5m step was
      // thrown away, which made running distance far too short).
      if (d < MIN_MOVEMENT_KM) return;

      runData.distanceKm += d;

      // Classify this segment as running or walking using speed over the last ~10s
      const w = runData.win;
      w.push({ t: timestamp, km: runData.distanceKm });
      while (w.length > 2 && timestamp - w[0].t > WINDOW_MS) w.shift();
      const spanSec = (timestamp - w[0].t) / 1000;
      const speed = spanSec >= 3 ? ((runData.distanceKm - w[0].km) * 1000) / spanSec : impliedSpeed;
      if (speed >= RUN_SPEED_MS) {
        runData.runKm += d;
        runData.runSec += dtSec;
      } else {
        runData.walkKm += d;
        runData.walkSec += dtSec;
      }
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

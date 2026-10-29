import {
  BASE_GAP_HEIGHT, BASE_SCROLL_SPEED, BOSS_FAST_MULTIPLIER, BOSS_PATTERNS, BOSS_SLOW_MULTIPLIER,
  MOVING_GAP_CHANCE, NORMAL_SPECIAL_CHANCE, NORMAL_TIMING_WINDOW_SECONDS,
  SPECIAL_UNLOCK_SCORE, SPEED_STEP_INCREMENT, SPEED_STEP_SCORE_POINTS, WARNING_GAP_MULTIPLIER,
  WARNING_SCORE_STEP_MAX, WARNING_SCORE_STEP_MIN, WARNING_SPECIAL_CHANCE, WARNING_START_SCORE,
  WARNING_TIMING_WINDOW_SECONDS,
} from './constants.js';
import { getAircraftDefinition } from './aircraft.js';

function normalizeScore(score) { return Number.isFinite(score) ? Math.max(0, Math.trunc(score)) : 0; }
function normalizeElapsed(value) { return Number.isFinite(value) ? Math.max(0, value) : 0; }
function normalizeBossCount(value) { return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0; }
function roll(rng) { return Math.min(0.999999, Math.max(0, Number(rng()) || 0)); }

export function getBaseSpeed(progressionScore, aircraftId = 'default') {
  const aircraft = getAircraftDefinition(aircraftId);
  const cappedScore = Math.min(aircraft.speedCapScore, normalizeScore(progressionScore));
  // Callers apply the aircraft movement factor after this shared base. Only the
  // starting speed is doubled for VELOCITY; actual progression stays +10 for all.
  return BASE_SCROLL_SPEED + SPEED_STEP_INCREMENT * Math.floor(cappedScore / SPEED_STEP_SCORE_POINTS)
    / aircraft.scrollSpeedMultiplier;
}
export function chooseBossPattern(rng = Math.random) {
  const patterns = Object.values(BOSS_PATTERNS);
  return patterns[Math.floor(roll(rng) * patterns.length)];
}
export function chooseWarningScoreStep(rng = Math.random) {
  return WARNING_SCORE_STEP_MIN + Math.floor(roll(rng) * (WARNING_SCORE_STEP_MAX - WARNING_SCORE_STEP_MIN + 1));
}
export function getBossSpeedMultiplier(pattern, elapsedSeconds = 0) {
  if (pattern === BOSS_PATTERNS.SLOW) return BOSS_SLOW_MULTIPLIER;
  if (pattern === BOSS_PATTERNS.FAST) return BOSS_FAST_MULTIPLIER;
  return Math.floor(normalizeElapsed(elapsedSeconds) / 2) % 2 === 0 ? BOSS_SLOW_MULTIPLIER : BOSS_FAST_MULTIPLIER;
}
export function getDifficulty(score, elapsedSeconds, completedBossCount, rng = Math.random, bossPatternOverride = null, nextWarningScore = WARNING_START_SCORE, progressionScore = score, firstBossCleared = false, aircraftId = 'default') {
  const safeScore = normalizeScore(score);
  const activeBossNumber = normalizeBossCount(completedBossCount) + 1;
  const warningThreshold = normalizeScore(nextWarningScore);
  // Standalone WARNING is archived for a future redesign; every threshold now
  // starts a real boss. The legacy warningIndex field is the actual boss number.
  const isWarning = false;
  const isBoss = safeScore >= warningThreshold;
  const bossPattern = isBoss ? (bossPatternOverride ?? chooseBossPattern(rng)) : null;
  const speedMultiplier = isBoss ? getBossSpeedMultiplier(bossPattern, elapsedSeconds) : 1;
  const warningMode = isWarning || isBoss;
  return {
    score: safeScore, progressionScore: normalizeScore(progressionScore), elapsedSeconds: normalizeElapsed(elapsedSeconds), warningIndex: isBoss ? activeBossNumber : 0,
    isWarning, isBoss, bossPattern, baseSpeed: getBaseSpeed(progressionScore, aircraftId), speedMultiplier,
    scrollSpeed: getBaseSpeed(progressionScore, aircraftId) * speedMultiplier,
    gapHeight: warningMode ? BASE_GAP_HEIGHT * WARNING_GAP_MULTIPLIER : BASE_GAP_HEIGHT,
    specialChance: safeScore >= SPECIAL_UNLOCK_SCORE ? (warningMode ? WARNING_SPECIAL_CHANCE : NORMAL_SPECIAL_CHANCE) : 0,
    movingGapChance: firstBossCleared ? MOVING_GAP_CHANCE : 0,
    timingWindowSeconds: warningMode ? WARNING_TIMING_WINDOW_SECONDS : NORMAL_TIMING_WINDOW_SECONDS,
    nextWarningScore: warningThreshold,
  };
}
export function shouldSpawnSpecial(rng, difficulty) { return roll(rng) < (difficulty?.specialChance ?? 0); }
export function shouldSpawnMovingGap(rng, difficulty) { return roll(rng) < (difficulty?.movingGapChance ?? 0); }

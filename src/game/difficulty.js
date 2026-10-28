import {
  BASE_GAP_HEIGHT, BASE_SCROLL_SPEED, BOSS_FAST_MULTIPLIER, BOSS_PATTERNS, BOSS_SLOW_MULTIPLIER,
  MOVING_GAP_CHANCE, NORMAL_SPECIAL_CHANCE, NORMAL_TIMING_WINDOW_SECONDS,
  SPECIAL_UNLOCK_SCORE, SPEED_CAP_SCORE, SPEED_STEP_MULTIPLIER, SPEED_STEP_SCORE_POINTS, WARNING_GAP_MULTIPLIER,
  WARNING_SCORE_STEP_MAX, WARNING_SCORE_STEP_MIN, WARNING_SPECIAL_CHANCE, WARNING_START_SCORE,
  WARNING_TIMING_WINDOW_SECONDS,
} from './constants.js';

function normalizeScore(score) { return Number.isFinite(score) ? Math.max(0, Math.trunc(score)) : 0; }
function normalizeElapsed(value) { return Number.isFinite(value) ? Math.max(0, value) : 0; }
function normalizeWarningCount(value) { return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0; }
function roll(rng) { return Math.min(0.999999, Math.max(0, Number(rng()) || 0)); }

export function getBaseSpeed(progressionScore) {
  const cappedScore = Math.min(SPEED_CAP_SCORE, normalizeScore(progressionScore));
  return BASE_SCROLL_SPEED * (SPEED_STEP_MULTIPLIER ** Math.floor(cappedScore / SPEED_STEP_SCORE_POINTS));
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
export function getDifficulty(score, elapsedSeconds, warningCount, rng = Math.random, bossPatternOverride = null, nextWarningScore = WARNING_START_SCORE, progressionScore = score, firstBossCleared = false) {
  const safeScore = normalizeScore(score);
  const activeWarningIndex = normalizeWarningCount(warningCount) + 1;
  const warningThreshold = normalizeScore(nextWarningScore);
  const isWarning = safeScore >= warningThreshold;
  const isBoss = isWarning && activeWarningIndex % 2 === 0;
  const bossPattern = isBoss ? (bossPatternOverride ?? chooseBossPattern(rng)) : null;
  const speedMultiplier = isBoss ? getBossSpeedMultiplier(bossPattern, elapsedSeconds) : 1;
  const warningMode = isWarning || isBoss;
  return {
    score: safeScore, progressionScore: normalizeScore(progressionScore), elapsedSeconds: normalizeElapsed(elapsedSeconds), warningIndex: isWarning ? activeWarningIndex : 0,
    isWarning, isBoss, bossPattern, baseSpeed: getBaseSpeed(progressionScore), speedMultiplier,
    scrollSpeed: getBaseSpeed(progressionScore) * speedMultiplier,
    gapHeight: warningMode ? BASE_GAP_HEIGHT * WARNING_GAP_MULTIPLIER : BASE_GAP_HEIGHT,
    specialChance: safeScore >= SPECIAL_UNLOCK_SCORE ? (warningMode ? WARNING_SPECIAL_CHANCE : NORMAL_SPECIAL_CHANCE) : 0,
    movingGapChance: firstBossCleared ? MOVING_GAP_CHANCE : 0,
    timingWindowSeconds: warningMode ? WARNING_TIMING_WINDOW_SECONDS : NORMAL_TIMING_WINDOW_SECONDS,
    nextWarningScore: warningThreshold,
  };
}
export function shouldSpawnSpecial(rng, difficulty) { return roll(rng) < (difficulty?.specialChance ?? 0); }
export function shouldSpawnMovingGap(rng, difficulty) { return roll(rng) < (difficulty?.movingGapChance ?? 0); }

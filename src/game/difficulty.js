import {
  BASE_GAP_HEIGHT,
  BASE_SCROLL_SPEED,
  BOSS_FAST_MULTIPLIER,
  BOSS_PATTERNS,
  BOSS_SLOW_MULTIPLIER,
  NORMAL_SPECIAL_CHANCE,
  NORMAL_TIMING_WINDOW_SECONDS,
  MOVING_GAP_CHANCE,
  MOVING_GAP_UNLOCK_SCORE,
  SPECIAL_UNLOCK_SCORE,
  SPEED_STEP_MULTIPLIER,
  SPEED_STEP_SECONDS,
  WARNING_GAP_MULTIPLIER,
  WARNING_SCORE_STEP,
  WARNING_SPECIAL_CHANCE,
  WARNING_START_SCORE,
  WARNING_TIMING_WINDOW_SECONDS,
} from './constants.js';

function normalizeScore(score) {
  return Number.isFinite(score) ? Math.max(0, Math.trunc(score)) : 0;
}

function normalizeElapsed(elapsedSeconds) {
  return Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
}

function normalizeWarningCount(warningCount) {
  return Number.isFinite(warningCount) ? Math.max(0, Math.trunc(warningCount)) : 0;
}

export function getBaseSpeed(elapsedSeconds) {
  const safeElapsed = normalizeElapsed(elapsedSeconds);
  const speedTier = Math.floor(safeElapsed / SPEED_STEP_SECONDS);
  return BASE_SCROLL_SPEED * (SPEED_STEP_MULTIPLIER ** speedTier);
}

export function chooseBossPattern(rng = Math.random) {
  const roll = Math.min(0.999999, Math.max(0, Number(rng()) || 0));
  const patterns = Object.values(BOSS_PATTERNS);
  return patterns[Math.floor(roll * patterns.length)];
}

export function getBossSpeedMultiplier(pattern, elapsedSeconds = 0) {
  if (pattern === BOSS_PATTERNS.SLOW) {
    return BOSS_SLOW_MULTIPLIER;
  }

  if (pattern === BOSS_PATTERNS.FAST) {
    return BOSS_FAST_MULTIPLIER;
  }

  const shiftCycle = Math.floor(normalizeElapsed(elapsedSeconds) / 2) % 2;
  return shiftCycle === 0 ? BOSS_SLOW_MULTIPLIER : BOSS_FAST_MULTIPLIER;
}

export function getDifficulty(score, elapsedSeconds, warningCount, rng = Math.random, bossPatternOverride = null) {
  const safeScore = normalizeScore(score);
  const completedWarnings = normalizeWarningCount(warningCount);
  const activeWarningIndex = completedWarnings + 1;
  const warningThreshold = WARNING_START_SCORE + completedWarnings * WARNING_SCORE_STEP;
  const isWarning = safeScore >= warningThreshold;
  const isBoss = isWarning && activeWarningIndex % 5 === 0;
  const bossPattern = isBoss ? (bossPatternOverride ?? chooseBossPattern(rng)) : null;
  const speedMultiplier = isBoss ? getBossSpeedMultiplier(bossPattern, elapsedSeconds) : 1;
  const warningMode = isWarning || isBoss;

  return {
    score: safeScore,
    elapsedSeconds: normalizeElapsed(elapsedSeconds),
    warningIndex: isWarning ? activeWarningIndex : 0,
    isWarning,
    isBoss,
    bossPattern,
    baseSpeed: getBaseSpeed(elapsedSeconds),
    speedMultiplier,
    scrollSpeed: getBaseSpeed(elapsedSeconds) * speedMultiplier,
    gapHeight: warningMode ? BASE_GAP_HEIGHT * WARNING_GAP_MULTIPLIER : BASE_GAP_HEIGHT,
    specialChance: safeScore >= SPECIAL_UNLOCK_SCORE
      ? (warningMode ? WARNING_SPECIAL_CHANCE : NORMAL_SPECIAL_CHANCE)
      : 0,
    movingGapChance: safeScore >= MOVING_GAP_UNLOCK_SCORE ? MOVING_GAP_CHANCE : 0,
    timingWindowSeconds: warningMode
      ? WARNING_TIMING_WINDOW_SECONDS
      : NORMAL_TIMING_WINDOW_SECONDS,
    nextWarningScore: warningThreshold,
  };
}

export function shouldSpawnSpecial(rng, difficulty) {
  const roll = Math.min(0.999999, Math.max(0, Number(rng()) || 0));
  return roll < (difficulty?.specialChance ?? 0);
}

export function shouldSpawnMovingGap(rng, difficulty) {
  const roll = Math.min(0.999999, Math.max(0, Number(rng()) || 0));
  return roll < (difficulty?.movingGapChance ?? 0);
}

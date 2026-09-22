import {
  BOSS_MIN_SPECIALS,
  BOSS_OBSTACLE_COUNT,
  DASH_DURATION_SECONDS,
  GRAVITY,
  MAX_FRAME_DELTA_SECONDS,
  NORMAL_SPAWN_INTERVAL_SECONDS,
  OBSTACLE_SPAWN_X,
  PAUSE_SCORE_PENALTY,
  WARNING_MIN_SPECIALS,
  WARNING_OBSTACLE_COUNT,
  WARNING_SPAWN_INTERVAL_SECONDS,
  WORLD_HEIGHT,
} from './constants.js';
import { applyLift, createPlayer, isOutOfBounds, updatePlayer } from './player.js';
import { GAME_STATES } from './game-state.js';
import { advanceDash, intersectsPlayerObstacle, isSpecialTimingSuccess, startDash } from './collision.js';
import { chooseBossPattern, getBossSpeedMultiplier, getDifficulty, shouldSpawnSpecial } from './difficulty.js';
import { createObstacle, updateObstacle } from './obstacles.js';
import { advanceScore } from './score.js';

function safeRandom(rng) {
  return Math.min(0.999999, Math.max(0, Number(rng()) || 0));
}

function createGapCenter(gapHeight, rng) {
  const halfGap = gapHeight / 2;
  return halfGap + safeRandom(rng) * (WORLD_HEIGHT - gapHeight);
}

export function createGameEngine(deps = {}) {
  const now = deps.now ?? (() => performance.now());
  const gravity = deps.gravity ?? GRAVITY;
  const initialScore = Math.max(0, Math.trunc(deps.initialScore ?? 0));
  const initialCompletedWarningCount = Math.max(0, Math.trunc(deps.initialCompletedWarningCount ?? 0));
  const rng = deps.rng ?? Math.random;

  let state = GAME_STATES.MENU;
  let player = createPlayer();
  let scoreSession = { score: initialScore, passedObstacleIds: new Set() };
  let elapsedSeconds = 0;
  let lastUpdateMs = null;
  let gameOverReason = null;
  let obstacles = [];
  let nextObstacleId = 1;
  let spawnAccumulatorSeconds = 0;
  let completedWarningCount = 0;
  let warningSession = null;

  function getScore() {
    return scoreSession.score;
  }

  function getCurrentDifficulty() {
    if (!warningSession) {
      return getDifficulty(getScore(), elapsedSeconds, completedWarningCount, rng);
    }

    const base = getDifficulty(
      getScore(),
      elapsedSeconds,
      completedWarningCount,
      rng,
      warningSession.bossPattern,
    );
    const speedMultiplier = warningSession.isBoss
      ? getBossSpeedMultiplier(warningSession.bossPattern, elapsedSeconds)
      : 1;

    return {
      ...base,
      warningIndex: warningSession.index,
      isWarning: true,
      isBoss: warningSession.isBoss,
      bossPattern: warningSession.bossPattern,
      speedMultiplier,
      scrollSpeed: base.baseSpeed * speedMultiplier,
      gapHeight: base.gapHeight,
      specialChance: base.specialChance,
      timingWindowSeconds: base.timingWindowSeconds,
    };
  }

  function startWarningIfNeeded() {
    if (warningSession) return;

    const candidate = getDifficulty(getScore(), elapsedSeconds, completedWarningCount, rng);
    if (!candidate.isWarning) return;

    const isBoss = candidate.warningIndex % 5 === 0;
    warningSession = {
      index: candidate.warningIndex,
      isBoss,
      bossPattern: isBoss ? chooseBossPattern(rng) : null,
      targetCount: isBoss ? BOSS_OBSTACLE_COUNT : WARNING_OBSTACLE_COUNT,
      spawnedCount: 0,
      requiredSpecials: isBoss ? BOSS_MIN_SPECIALS : WARNING_MIN_SPECIALS,
      specialObstacleIds: new Set(),
      specialSpawnedCount: 0,
    };
  }

  function spawnObstacle(difficulty) {
    const session = warningSession;
    const remainingSlots = session ? session.targetCount - session.spawnedCount : 0;
    const remainingSpecials = session ? session.requiredSpecials - session.specialObstacleIds.size : 0;
    const forceSpecial = Boolean(session && remainingSlots <= remainingSpecials);
    const kind = forceSpecial || shouldSpawnSpecial(rng, difficulty) ? 'special' : 'normal';
    const obstacle = createObstacle({
      id: `wall-${nextObstacleId++}`,
      x: OBSTACLE_SPAWN_X,
      gapCenter: createGapCenter(difficulty.gapHeight, rng),
      gapHeight: difficulty.gapHeight,
      kind,
      warningIndex: session?.index ?? 0,
      rng,
    });

    obstacles.push(obstacle);
    if (session) {
      session.spawnedCount += 1;
      if (kind === 'special') session.specialObstacleIds.add(obstacle.id);
      if (kind === 'special') session.specialSpawnedCount += 1;
    }
  }

  function updateSpawning(deltaSeconds, difficulty) {
    spawnAccumulatorSeconds += deltaSeconds;
    let activeDifficulty = difficulty;
    let interval = warningSession ? WARNING_SPAWN_INTERVAL_SECONDS : NORMAL_SPAWN_INTERVAL_SECONDS;

    while (spawnAccumulatorSeconds >= interval
      && (!warningSession || warningSession.spawnedCount < warningSession.targetCount)) {
      spawnAccumulatorSeconds -= interval;
      spawnObstacle(activeDifficulty);
      activeDifficulty = getCurrentDifficulty();
      interval = warningSession ? WARNING_SPAWN_INTERVAL_SECONDS : NORMAL_SPAWN_INTERVAL_SECONDS;
    }
  }

  function processPassedObstacles() {
    const playerLeft = player.x - player.width / 2;
    for (const obstacle of obstacles) {
      if (obstacle.x + obstacle.width >= playerLeft || obstacle.passed) continue;
      obstacle.passed = true;
      if (advanceScore(scoreSession, obstacle.id)) {
        if (warningSession?.specialObstacleIds.has(obstacle.id)) {
          warningSession.specialObstacleIds.delete(obstacle.id);
        }
        startWarningIfNeeded();
      }
    }

    if (warningSession
      && warningSession.spawnedCount === warningSession.targetCount
      && warningSession.specialObstacleIds.size === 0) {
      completedWarningCount += 1;
      warningSession = null;
      spawnAccumulatorSeconds = 0;
    }

    obstacles = obstacles.filter((obstacle) => !obstacle.passed && obstacle.x + obstacle.width >= 0);
  }

  function start() {
    player = createPlayer();
    scoreSession = { score: initialScore, passedObstacleIds: new Set() };
    elapsedSeconds = 0;
    gameOverReason = null;
    obstacles = [];
    nextObstacleId = 1;
    spawnAccumulatorSeconds = NORMAL_SPAWN_INTERVAL_SECONDS;
    completedWarningCount = initialCompletedWarningCount;
    warningSession = null;
    lastUpdateMs = now();
    state = GAME_STATES.PLAYING;
    startWarningIfNeeded();
  }

  function update(nowMs) {
    if (state !== GAME_STATES.PLAYING || !Number.isFinite(nowMs)) {
      return;
    }

    if (lastUpdateMs === null) {
      lastUpdateMs = nowMs;
      return;
    }

    const rawDelta = Math.max(0, (nowMs - lastUpdateMs) / 1000);
    const deltaSeconds = Math.min(rawDelta, MAX_FRAME_DELTA_SECONDS);
    lastUpdateMs = nowMs;
    if (deltaSeconds <= 0) return;

    updatePlayer(player, deltaSeconds, gravity);
    elapsedSeconds += deltaSeconds;
    let difficulty = getCurrentDifficulty();
    updateSpawning(deltaSeconds, difficulty);
    difficulty = getCurrentDifficulty();

    for (const obstacle of obstacles) {
      updateObstacle(obstacle, deltaSeconds, difficulty.scrollSpeed);
    }
    advanceDash(player, deltaSeconds);

    if (isOutOfBounds(player, WORLD_HEIGHT)) {
      stop('boundary');
      return;
    }

    if (obstacles.some((obstacle) => intersectsPlayerObstacle(player, obstacle))) {
      stop('obstacle');
      return;
    }

    processPassedObstacles();
  }

  function pause() {
    if (state !== GAME_STATES.PLAYING) {
      return { score: getScore() };
    }

    scoreSession.score = Math.max(0, getScore() - PAUSE_SCORE_PENALTY);
    state = GAME_STATES.PAUSED;
    return { score: getScore() };
  }

  function lift() {
    if (state !== GAME_STATES.PLAYING) return false;
    applyLift(player);
    return true;
  }

  function dash() {
    if (state !== GAME_STATES.PLAYING) return false;
    const difficulty = getCurrentDifficulty();
    const target = obstacles
      .filter((obstacle) => obstacle.kind === 'special' && !obstacle.passed && obstacle.x >= player.x)
      .sort((left, right) => left.x - right.x)[0];
    if (!target || !isSpecialTimingSuccess({
      playerX: player.x,
      wallX: target.x,
      speed: difficulty.scrollSpeed,
      windowSeconds: difficulty.timingWindowSeconds,
    })) {
      return false;
    }

    startDash(player, DASH_DURATION_SECONDS, target.id);
    return true;
  }

  function resume() {
    if (state !== GAME_STATES.PAUSED) {
      return;
    }

    lastUpdateMs = now();
    state = GAME_STATES.PLAYING;
  }

  function stop(reason = 'unknown') {
    if (state === GAME_STATES.GAME_OVER) {
      return;
    }

    gameOverReason = reason;
    state = GAME_STATES.GAME_OVER;
  }

  function getSnapshot() {
    return {
      state,
      score: getScore(),
      elapsedSeconds,
      gameOverReason,
      player: { ...player },
      obstacles: obstacles.map((obstacle) => ({ ...obstacle })),
      difficulty: { ...getCurrentDifficulty() },
      warning: warningSession ? {
        index: warningSession.index,
        spawnedCount: warningSession.spawnedCount,
        targetCount: warningSession.targetCount,
        requiredSpecials: warningSession.requiredSpecials,
        specialSpawnedCount: warningSession.specialSpawnedCount,
        remainingSpecials: warningSession.specialObstacleIds.size,
      } : null,
    };
  }

  return { start, update, lift, dash, pause, resume, stop, getSnapshot };
}

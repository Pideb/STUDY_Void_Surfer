import {
  BOSS_MIN_SPECIALS,
  BOSS_OBSTACLE_COUNT,
  DASH_DURATION_SECONDS,
  GRAVITY,
  LIFT_VELOCITY,
  MAX_FRAME_DELTA_SECONDS,
  NORMAL_MOVING_GAP_CYCLE_SECONDS,
  NORMAL_SPAWN_INTERVAL_SECONDS,
  OBSTACLE_SPAWN_X,
  PAUSE_SCORE_PENALTY,
  SPECIAL_TIMING_GUIDE_COUNT,
  SPECIAL_BREAK_DURATION_SECONDS,
  WARNING_START_SCORE,
  WARNING_MIN_SPECIALS,
  WARNING_MOVING_GAP_CYCLE_SECONDS,
  WARNING_OBSTACLE_COUNT,
  WARNING_SPAWN_INTERVAL_SECONDS,
  WORLD_HEIGHT,
} from './constants.js';
import { applyLift, createPlayer, isOutOfBounds, updatePlayer } from './player.js';
import { GAME_STATES } from './game-state.js';
import { advanceDash, intersectsPlayerObstacle, isSpecialTimingSuccess, startDash } from './collision.js';
import {
  chooseBossPattern,
  chooseWarningScoreStep,
  getBossSpeedMultiplier,
  getDifficulty,
  shouldSpawnMovingGap,
  shouldSpawnSpecial,
} from './difficulty.js';
import { createObstacle, updateObstacle } from './obstacles.js';
import { advanceScore } from './score.js';
import { getAircraftDefinition, isAircraftUnlocked } from './aircraft.js';

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
  let accountBestScore = Math.max(0, Number(deps.accountBestScore) || 0);
  let aircraft = getAircraftDefinition(deps.aircraftId);

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
  let nextWarningScore = WARNING_START_SCORE;
  let specialsSpawnedThisRun = 0;

  function getScore() {
    return scoreSession.score;
  }

  function getCurrentDifficulty() {
    if (!warningSession) {
      const base = getDifficulty(getScore(), elapsedSeconds, completedWarningCount, rng, null, nextWarningScore);
      return applyAircraftDifficulty(base);
    }

    const base = getDifficulty(
      getScore(),
      elapsedSeconds,
      completedWarningCount,
      rng,
      warningSession.bossPattern, nextWarningScore,
    );
    const speedMultiplier = warningSession.isBoss
      ? getBossSpeedMultiplier(warningSession.bossPattern, elapsedSeconds)
      : 1;

    return applyAircraftDifficulty({
      ...base,
      warningIndex: warningSession.index,
      isWarning: true,
      isBoss: warningSession.isBoss,
      bossPattern: warningSession.bossPattern,
      speedMultiplier,
      scrollSpeed: base.baseSpeed * speedMultiplier,
      gapHeight: base.gapHeight,
      specialChance: base.specialChance,
      movingGapChance: base.movingGapChance,
      timingWindowSeconds: base.timingWindowSeconds,
    });
  }

  function applyAircraftDifficulty(difficulty) {
    return {
      ...difficulty,
      aircraftId: aircraft.id,
      aircraftScrollSpeedMultiplier: aircraft.scrollSpeedMultiplier,
      aircraftSpawnIntervalMultiplier: aircraft.spawnIntervalMultiplier,
      scrollSpeed: difficulty.scrollSpeed * aircraft.scrollSpeedMultiplier,
    };
  }

  function startWarningIfNeeded() {
    if (warningSession) return;

    const candidate = getDifficulty(getScore(), elapsedSeconds, completedWarningCount, rng, null, nextWarningScore);
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
    const movingGap = kind === 'normal' && shouldSpawnMovingGap(rng, difficulty);
    const gapMotionCycleSeconds = movingGap
      ? (difficulty.isWarning || difficulty.isBoss
        ? WARNING_MOVING_GAP_CYCLE_SECONDS
        : NORMAL_MOVING_GAP_CYCLE_SECONDS)
      : null;
    const showTimingGuide = kind === 'special' && ++specialsSpawnedThisRun <= SPECIAL_TIMING_GUIDE_COUNT;
    const obstacle = createObstacle({
      id: `wall-${nextObstacleId++}`,
      x: OBSTACLE_SPAWN_X,
      gapCenter: createGapCenter(difficulty.gapHeight, rng),
      gapHeight: difficulty.gapHeight,
      kind,
      warningIndex: session?.index ?? 0,
      movingGap,
      gapMotionPhase: movingGap ? safeRandom(rng) * Math.PI * 2 : null,
      gapMotionCycleSeconds,
      showTimingGuide,
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
    let interval = (warningSession ? WARNING_SPAWN_INTERVAL_SECONDS : NORMAL_SPAWN_INTERVAL_SECONDS)
      * aircraft.spawnIntervalMultiplier;

    while (spawnAccumulatorSeconds >= interval
      && (!warningSession || warningSession.spawnedCount < warningSession.targetCount)) {
      spawnAccumulatorSeconds -= interval;
      spawnObstacle(activeDifficulty);
      activeDifficulty = getCurrentDifficulty();
      interval = (warningSession ? WARNING_SPAWN_INTERVAL_SECONDS : NORMAL_SPAWN_INTERVAL_SECONDS)
        * aircraft.spawnIntervalMultiplier;
    }
  }

  function processPassedObstacles() {
    const playerLeft = player.x - player.width / 2;
    for (const obstacle of obstacles) {
      if (obstacle.x + obstacle.width >= playerLeft || obstacle.passed) continue;
      obstacle.passed = true;
      if (advanceScore(scoreSession, obstacle.id, aircraft.scoreMultiplier)) {
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
      nextWarningScore = getScore() + chooseWarningScoreStep(rng);
      warningSession = null;
      spawnAccumulatorSeconds = 0;
    }

    obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width >= 0);
  }

  function start() {
    player = createPlayer();
    scoreSession = { score: initialScore, passedObstacleIds: new Set() };
    elapsedSeconds = 0;
    gameOverReason = null;
    obstacles = [];
    nextObstacleId = 1;
    spawnAccumulatorSeconds = NORMAL_SPAWN_INTERVAL_SECONDS * aircraft.spawnIntervalMultiplier;
    completedWarningCount = initialCompletedWarningCount;
    warningSession = null;
    nextWarningScore = WARNING_START_SCORE + initialCompletedWarningCount * 10;
    specialsSpawnedThisRun = 0;
    lastUpdateMs = now();
    state = GAME_STATES.PLAYING;
    startWarningIfNeeded();
  }

  function setAccountBestScore(bestScore) {
    if (state === GAME_STATES.PLAYING || state === GAME_STATES.PAUSED || state === GAME_STATES.GAME_OVER) {
      return accountBestScore;
    }
    accountBestScore = Math.max(0, Number(bestScore) || 0);
    if (!isAircraftUnlocked(aircraft.id, accountBestScore)) {
      aircraft = getAircraftDefinition('default');
    }
    return accountBestScore;
  }

  function setAircraft(id) {
    if (state === GAME_STATES.PLAYING || state === GAME_STATES.PAUSED || state === GAME_STATES.GAME_OVER) {
      return false;
    }
    const definition = getAircraftDefinition(id);
    if (!isAircraftUnlocked(definition.id, accountBestScore)) return false;
    aircraft = definition;
    return aircraft.id;
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

    updatePlayer(player, deltaSeconds, gravity * aircraft.gravityMultiplier);
    elapsedSeconds += deltaSeconds;
    let difficulty = getCurrentDifficulty();
    updateSpawning(deltaSeconds, difficulty);
    difficulty = getCurrentDifficulty();

    for (const obstacle of obstacles) {
      updateObstacle(obstacle, deltaSeconds, difficulty.scrollSpeed, elapsedSeconds);
      if (obstacle.breakEffect) {
        obstacle.breakEffect.remainingSeconds -= deltaSeconds;
        if (obstacle.breakEffect.remainingSeconds <= 0) delete obstacle.breakEffect;
      }
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
    applyLift(player, LIFT_VELOCITY * aircraft.liftMultiplier);
    return true;
  }

  function dash() {
    if (state !== GAME_STATES.PLAYING) return false;
    const difficulty = getCurrentDifficulty();
    const target = obstacles
      .filter((obstacle) => obstacle.kind === 'special' && !obstacle.passed && obstacle.x >= player.x)
      .sort((left, right) => left.x - right.x)[0];
    const isSpecialDash = target && isSpecialTimingSuccess({
      playerX: player.x,
      wallX: target.x,
      speed: difficulty.scrollSpeed,
      windowSeconds: difficulty.timingWindowSeconds,
    });
    startDash(player, DASH_DURATION_SECONDS, isSpecialDash ? target.id : null, isSpecialDash ? 'special' : 'normal');
    if (isSpecialDash) target.breakEffect = { centerY: player.y, remainingSeconds: SPECIAL_BREAK_DURATION_SECONDS, durationSeconds: SPECIAL_BREAK_DURATION_SECONDS };
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
      aircraft: {
        id: aircraft.id,
        name: aircraft.name,
        scoreMultiplier: aircraft.scoreMultiplier,
        gravityMultiplier: aircraft.gravityMultiplier,
        liftMultiplier: aircraft.liftMultiplier,
      },
      player: { ...player },
      obstacles: obstacles.map((obstacle) => ({ ...obstacle, breakEffect: obstacle.breakEffect ? { ...obstacle.breakEffect } : null })),
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

  return {
    start,
    update,
    lift,
    dash,
    pause,
    resume,
    stop,
    setAircraft,
    setAccountBestScore,
    getSnapshot,
  };
}

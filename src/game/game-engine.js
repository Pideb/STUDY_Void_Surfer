import {
  BOSS_MIN_SPECIALS,
  BOSS_OBSTACLE_COUNT,
  BOSS_PROJECTILE_NORMAL_WALL_COOLDOWN,
  BOSS_RESPONSE_COOLDOWN_SECONDS,
  BOSS_LASER_FOLLOW_UP_SECONDS,
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
  STAGE_ROTATION_SECONDS,
  STAGE_TRANSITION_SECONDS,
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
import { intersectsPlayerLaser, isProjectileReflectionSuccess } from './collision.js';
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
import { createStageShuffleBag, getStageDefinition } from './stages.js';
import { advanceBossEncounter, createBossEncounter, shouldStartBossChallenge } from './boss.js';
import {
  createBossProjectile,
  createQuarterLaser,
  createSingleLaser,
  isProjectileInReflectionWindow,
  reflectProjectile,
  updateBossProjectile,
  updateLaser,
} from './boss-attacks.js';
import {
  createChallenge,
  createChallengeFailureEffect,
  handleChallengeKey,
  updateChallenge,
} from './wasd-challenge.js';

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
  const stageRng = deps.stageRng ?? Math.random;
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
  let stageOrder = [];
  let stageIndex = 0;
  let stageElapsedSeconds = 0;
  let stageTransition = null;
  let bossEncounter = null;
  let challenge = null;
  let feedbackEffect = null;
  let nextAttackId = 1;

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
    bossEncounter = isBoss
      ? createBossEncounter(Math.max(1, Math.floor(candidate.warningIndex / 5)), rng)
      : null;
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
        if (bossEncounter && obstacle.warningIndex === warningSession?.index) {
          if (obstacle.kind === 'normal') {
            advanceBossEncounter(bossEncounter, 'normal-wall-passed');
          } else {
            advanceBossEncounter(bossEncounter, 'special-resolved', elapsedSeconds);
          }
        }
        if (warningSession?.specialObstacleIds.has(obstacle.id)) {
          warningSession.specialObstacleIds.delete(obstacle.id);
        }
        startWarningIfNeeded();
      }
    }

    if (warningSession
      && warningSession.spawnedCount === warningSession.targetCount
      && warningSession.specialObstacleIds.size === 0
      && !warningSession.isBoss) {
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
    stageOrder = createStageShuffleBag(stageRng);
    stageIndex = 0;
    stageElapsedSeconds = 0;
    stageTransition = null;
    bossEncounter = null;
    challenge = null;
    feedbackEffect = null;
    nextAttackId = 1;
    lastUpdateMs = now();
    state = GAME_STATES.PLAYING;
    startWarningIfNeeded();
  }

  function getStageState() {
    const stageId = stageOrder[stageIndex] ?? getStageDefinition().id;
    const definition = getStageDefinition(stageId);
    const mode = warningSession?.isBoss ? 'boss' : warningSession ? 'warning' : 'normal';
    return { definition, mode };
  }

  function getActiveBackgroundKey(definition, mode) {
    return mode === 'boss' ? definition.bossBackgroundKey : definition.backgroundKey;
  }

  function advanceStage() {
    const previous = getStageState();
    const nextIndex = stageIndex + 1;
    if (nextIndex < stageOrder.length) {
      stageIndex = nextIndex;
    } else {
      stageOrder = createStageShuffleBag(stageRng, previous.definition.id);
      stageIndex = 0;
    }
    const next = getStageState();
    stageTransition = {
      fromKey: getActiveBackgroundKey(previous.definition, previous.mode),
      toKey: getActiveBackgroundKey(next.definition, next.mode),
      progress: 0,
      durationSeconds: STAGE_TRANSITION_SECONDS,
    };
    stageElapsedSeconds = 0;
  }

  function updateStage(deltaSeconds) {
    stageElapsedSeconds += deltaSeconds;
    if (stageTransition) {
      stageTransition.progress = Math.min(
        1,
        stageTransition.progress + deltaSeconds / STAGE_TRANSITION_SECONDS,
      );
      if (stageTransition.progress >= 1) stageTransition = null;
    }
    if (stageElapsedSeconds >= STAGE_ROTATION_SECONDS) {
      advanceStage();
    }
  }

  function resolveChallenge() {
    if (!challenge || challenge.result === 'pending') return;
    if (challenge.result === 'failure') feedbackEffect = createChallengeFailureEffect(rng);
    if (bossEncounter) {
      advanceBossEncounter(bossEncounter, 'challenge-complete');
      bossEncounter.wallSpawningPaused = false;
    }
  }

  function getBossWallContext() {
    const activeWall = obstacles
      .filter((obstacle) => !obstacle.passed && obstacle.x >= player.x)
      .sort((left, right) => left.x - right.x)[0];
    return {
      gapCenter: activeWall?.gapCenter ?? WORLD_HEIGHT / 2,
      gapHeight: activeWall?.gapHeight ?? 180,
    };
  }

  function scheduleBossAttack(difficulty) {
    if (!bossEncounter || !warningSession?.isBoss || bossEncounter.attack || challenge?.active) return;
    if (warningSession.specialObstacleIds.size > 0) return;
    if (bossEncounter.normalWallsSinceProjectile < BOSS_PROJECTILE_NORMAL_WALL_COOLDOWN) return;
    if (bossEncounter.lastSpecialResolvedAt !== null
      && elapsedSeconds - bossEncounter.lastSpecialResolvedAt < BOSS_RESPONSE_COOLDOWN_SECONDS) return;
    if (bossEncounter.lastProjectileResolvedAt !== null
      && elapsedSeconds - bossEncounter.lastProjectileResolvedAt < BOSS_RESPONSE_COOLDOWN_SECONDS) return;

    const stageDefinition = getStageState().definition;
    const attackId = `boss-attack-${nextAttackId++}`;
    if (bossEncounter.number >= 5 && safeRandom(rng) < 0.25) {
      const context = getBossWallContext();
      const laser = safeRandom(rng) < 0.5
        ? createSingleLaser({ ...context, rng, styleKey: stageDefinition.laserStyle })
        : createQuarterLaser({ rng, styleKey: stageDefinition.laserStyle });
      bossEncounter.attack = { id: attackId, type: 'laser', ...laser };
      bossEncounter.wallSpawningPaused = true;
      return;
    }

    bossEncounter.attack = {
      id: attackId,
      type: 'projectile',
      ...createBossProjectile({
        id: attackId,
        bossX: 840,
        bossY: 80 + safeRandom(rng) * (WORLD_HEIGHT - 160),
        playerX: player.x,
        playerY: player.y,
        baseSpeed: difficulty.scrollSpeed,
        rng,
        styleKey: stageDefinition.projectileStyle,
      }),
    };
    bossEncounter.wallSpawningPaused = false;
  }

  function updateBossAttack(deltaSeconds) {
    if (!bossEncounter?.attack) return;
    const attack = bossEncounter.attack;
    if (attack.type === 'projectile') {
      updateBossProjectile(attack, deltaSeconds);
      if (attack.state === 'missed' && attack.hitPlayer) {
        stop('projectile');
        return;
      }
      if (attack.state === 'returning') {
        bossEncounter.reflectedProjectile = {
          id: attack.id,
          progress: attack.returnProgress,
        };
      }
      if (attack.state === 'resolved') {
        bossEncounter.reflectedProjectile = null;
        bossEncounter.hitEffect = { remainingSeconds: 0.38, durationSeconds: 0.38 };
        advanceBossEncounter(bossEncounter, 'projectile-resolved', elapsedSeconds);
        bossEncounter.attack = null;
      }
      return;
    }

    updateLaser(attack, deltaSeconds);
    if (intersectsPlayerLaser(player, attack, WORLD_HEIGHT)) {
      stop('laser');
      return;
    }
    if (attack.telegraphRemainingSeconds === 0 && attack.activeRemainingSeconds === 0) {
      bossEncounter.attack = null;
      bossEncounter.wallSpawningPaused = false;
      bossEncounter.lastProjectileResolvedAt = elapsedSeconds + BOSS_LASER_FOLLOW_UP_SECONDS;
      bossEncounter.normalWallsSinceProjectile = BOSS_PROJECTILE_NORMAL_WALL_COOLDOWN;
    }
  }

  function completeBossIfReady() {
    if (!bossEncounter || !warningSession?.isBoss || bossEncounter.hp > 0 || bossEncounter.attack || challenge?.active) {
      return;
    }
    advanceBossEncounter(bossEncounter, 'boss-cleared');
    scoreSession.score += 10;
    completedWarningCount += 1;
    nextWarningScore = getScore() + chooseWarningScoreStep(rng);
    warningSession = null;
    bossEncounter = null;
    spawnAccumulatorSeconds = 0;
  }

  function handleChallengeInput(code) {
    if (!challenge?.active) return false;
    const result = handleChallengeKey(challenge, code);
    if (result === 'success' || result === 'failure') resolveChallenge();
    return result !== 'ignored';
  }

  function setAccountBestScore(bestScore) {
    if (state === GAME_STATES.PLAYING || state === GAME_STATES.PAUSED) {
      return accountBestScore;
    }
    accountBestScore = Math.max(0, Number(bestScore) || 0);
    if (!isAircraftUnlocked(aircraft.id, accountBestScore)) {
      aircraft = getAircraftDefinition('default');
    }
    return accountBestScore;
  }

  function setAircraft(id) {
    if (state === GAME_STATES.PLAYING || state === GAME_STATES.PAUSED) {
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

    if (challenge?.active) {
      updateChallenge(challenge, deltaSeconds);
      resolveChallenge();
      return;
    }

    updatePlayer(player, deltaSeconds, gravity * aircraft.gravityMultiplier);
    elapsedSeconds += deltaSeconds;
    updateStage(deltaSeconds);
    let difficulty = getCurrentDifficulty();
    if (!bossEncounter?.wallSpawningPaused) updateSpawning(deltaSeconds, difficulty);
    difficulty = getCurrentDifficulty();

    for (const obstacle of obstacles) {
      updateObstacle(obstacle, deltaSeconds, difficulty.scrollSpeed, elapsedSeconds);
      if (obstacle.breakEffect) {
        obstacle.breakEffect.remainingSeconds -= deltaSeconds;
        if (obstacle.breakEffect.remainingSeconds <= 0) delete obstacle.breakEffect;
      }
    }
    advanceDash(player, deltaSeconds);
    updateBossAttack(deltaSeconds);
    if (bossEncounter?.hitEffect) {
      bossEncounter.hitEffect.remainingSeconds = Math.max(0, bossEncounter.hitEffect.remainingSeconds - deltaSeconds);
      if (bossEncounter.hitEffect.remainingSeconds === 0) bossEncounter.hitEffect = null;
    }
    if (feedbackEffect) {
      feedbackEffect.remainingSeconds = Math.max(0, feedbackEffect.remainingSeconds - deltaSeconds);
      if (feedbackEffect.remainingSeconds === 0) feedbackEffect = null;
    }

    if (isOutOfBounds(player, WORLD_HEIGHT)) {
      stop('boundary');
      return;
    }

    if (obstacles.some((obstacle) => intersectsPlayerObstacle(player, obstacle))) {
      stop('obstacle');
      return;
    }

    processPassedObstacles();
    completeBossIfReady();
    scheduleBossAttack(difficulty);
  }

  function pause() {
    if (state !== GAME_STATES.PLAYING) {
      return { score: getScore() };
    }
    if (challenge?.active) return { score: getScore() };

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
    if (challenge?.active) return false;
    if (bossEncounter?.attack?.type === 'projectile'
      && isProjectileInReflectionWindow(bossEncounter.attack, player.x)
      && isProjectileReflectionSuccess({ player, projectile: bossEncounter.attack })) {
      reflectProjectile(bossEncounter.attack, player.x, player.y);
      advanceBossEncounter(bossEncounter, 'projectile-reflected');
      if (shouldStartBossChallenge(bossEncounter)) {
        challenge = createChallenge({ bossNumber: bossEncounter.number, rng });
        bossEncounter.wallSpawningPaused = true;
      }
      startDash(player, DASH_DURATION_SECONDS, null, 'normal');
      return true;
    }
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
    const stageState = getStageState();
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
      stage: {
        id: stageState.definition.id,
        name: stageState.definition.name,
        index: stageIndex,
        order: [...stageOrder],
        elapsedSeconds: stageElapsedSeconds,
        mode: stageState.mode,
        backgroundKey: stageState.definition.backgroundKey,
        bossBackgroundKey: stageState.definition.bossBackgroundKey,
        transition: stageTransition ? { ...stageTransition } : null,
      },
      boss: bossEncounter ? {
        ...bossEncounter,
        attack: bossEncounter.attack ? { ...bossEncounter.attack } : null,
        hitEffect: bossEncounter.hitEffect ? { ...bossEncounter.hitEffect } : null,
        reflectedProjectile: bossEncounter.reflectedProjectile
          ? { ...bossEncounter.reflectedProjectile }
          : null,
      } : null,
      challenge: challenge ? { ...challenge, sequence: [...challenge.sequence] } : null,
      feedbackEffect: feedbackEffect ? { ...feedbackEffect } : null,
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
    handleChallengeKey: handleChallengeInput,
    getSnapshot,
  };
}

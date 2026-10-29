import { AMBIENT_LASER_UNLOCK_BOSSES, AMBIENT_LASER_INTERVAL_SECONDS, AMBIENT_LASER_CHANCE } from './constants.js';
import { createBossPatternRound } from './boss-patterns.js';
import {
  BOSS_MIN_SPECIALS,
  BOSS_OBSTACLE_COUNT,
  BOSS_ATTACK_NORMAL_WALL_COOLDOWN,
  BOSS_PATTERN_PREVIEW_SECONDS,
  DASH_DURATION_SECONDS,
  DASH_COOLDOWN_SECONDS,
  SPECIAL_RESPONSE_INTERVAL_SECONDS,
  PLAYER_HITBOX_SIZE,
  OBSTACLE_WIDTH,
  SPECIAL_OBSTACLE_WIDTH,
  FLIGHT_TRAIL_LIFETIME_SECONDS,
  GAP_CONTINUITY_SCORE,
  GRAVITY,
  LIFT_VELOCITY,
  MAX_GAP_CENTER_SHIFT_FACTOR,
  MAX_FRAME_DELTA_SECONDS,
  NORMAL_MOVING_GAP_CYCLE_SECONDS,
  NORMAL_SPAWN_INTERVAL_SECONDS,
  OBSTACLE_SPAWN_X,
  PAUSE_SCORE_PENALTY,
  PLAYER_DEATH_EFFECT_SECONDS,
  SPECIAL_BREAK_DURATION_SECONDS,
  SPEED_TRANSITION_SECONDS,
  WARNING_START_SCORE,
  WARNING_MIN_SPECIALS,
  WARNING_MOVING_GAP_CYCLE_SECONDS,
  WARNING_OBSTACLE_COUNT,
  WARNING_SPAWN_INTERVAL_SECONDS,
  VELOCITY_FAST_BOSS_SPEED_MULTIPLIER,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  BOSS_ROAR_SECONDS,
  BOSS_SINGLE_LASER_INTERVAL_SECONDS,
  BOSS_SINGLE_LASER_CHANCE,
  BOSS_DOUBLE_LASER_CHANCE,
  BOSS_VOLLEY_INTERVAL_SECONDS,
  BOSS_LASER_TELEGRAPH_SECONDS,
  BOSS_LASER_ACTIVE_SECONDS,
  BOSS_LASER_FADE_SECONDS,
} from './constants.js';
import { applyLift, createPlayer, isOutOfBounds, updatePlayer } from './player.js';
import { GAME_STATES } from './game-state.js';
import { advanceDash, intersectsSweptPlayerObstacle, isSpecialTimingSuccess, startDash } from './collision.js';
import { intersectsPlayerLaser } from './collision.js';
import {
  chooseBossPattern,
  chooseBossReentryScoreStep,
  chooseWarningScoreStep,
  getBaseSpeed,
  getBossSpeedMultiplier,
  getDifficulty,
  shouldSpawnMovingGap,
  shouldSpawnSpecial,
} from './difficulty.js';
import { createObstacle, getDashBarrierBounds, isDashObstacle, updateObstacle } from './obstacles.js';
import { advanceScore } from './score.js';
import { getBarrierSpeedBound } from './barrier-spacing.js';
import { getBossGeometry } from './boss-geometry.js';
import { getBossPose, getBossRecoil } from './boss-motion.js';
import { advanceBossWeapon, startBossWeapon } from './boss-weapon.js';
import { intersectsBossBeam } from './boss-beam.js';
import { getPlayerBounds } from './player-geometry.js';
import { createSignatureAttack, updateSignatureAttack } from './boss-signatures.js';
import { createPortalTransition, advancePortalTransition } from './portal-transition.js';
import { getAircraftDefinition, canSelectAircraft } from './aircraft.js';
import { createStageShuffleBag, getStageDefinition } from './stages.js';
import {
  advanceBossEncounter,
  createBossEncounter,
} from './boss.js';
import {
  createQuarterLaser,
  createSingleLaser,
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

export function constrainGapCenter(candidate, gapHeight, previousCenter) {
  const halfGap = gapHeight / 2;
  const minCenter = halfGap;
  const maxCenter = WORLD_HEIGHT - halfGap;
  const maxShift = gapHeight * MAX_GAP_CENTER_SHIFT_FACTOR;
  return Math.min(maxCenter, Math.max(minCenter,
    Math.min(previousCenter + maxShift, Math.max(previousCenter - maxShift, candidate))));
}

export function createGameEngine(deps = {}) {
  const now = deps.now ?? (() => performance.now());
  const gravity = deps.gravity ?? GRAVITY;
  const initialScore = Math.max(0, Math.trunc(deps.initialScore ?? 0));
  const initialCompletedWarningCount = Math.max(0, Math.trunc(deps.initialCompletedWarningCount ?? 0));
  // Compatibility for old replay/test fixtures: two old warning events were one
  // cleared boss. New fixtures use an explicit count of actual cleared bosses.
  const initialClearedBossCount = Math.max(0, Math.trunc(deps.initialClearedBossCount ?? Math.floor(initialCompletedWarningCount / 2)));
  const initialNextBossScore = Number.isFinite(deps.initialNextBossScore)
    ? Math.max(0, deps.initialNextBossScore) : WARNING_START_SCORE + initialClearedBossCount * 20;
  const rng = deps.rng ?? Math.random;
  const stageRng = deps.stageRng ?? Math.random;
  let accountBestScore = Math.max(0, Number(deps.accountBestScore) || 0);
  let guestMode = Boolean(deps.guestMode);
  let invincibilityEnabled = Boolean(deps.invincibilityEnabled);
  let aircraft = getAircraftDefinition(deps.aircraftId);
  if(!canSelectAircraft(aircraft.id,{guestMode,bestScore:accountBestScore}))aircraft=getAircraftDefinition();

  let state = GAME_STATES.MENU;
  let player = createPlayer();
  let scoreSession = { score: initialScore, progressionScore: initialScore, passedObstacleIds: new Set() };
  let elapsedSeconds = 0;
  let lastUpdateMs = null;
  let gameOverReason = null;
  let deathEffect = null;
  let obstacles = [];
  let nextObstacleId = 1;
  let spawnAccumulatorSeconds = 0;
  let clearedBossCount = 0;
  let ambientLaserElapsedSeconds = 0;
  let ambientAttack = null;
  let warningSession = null;
  let bossPreview = null;
  let bossEntry = null;
  let nextWarningScore = WARNING_START_SCORE;
  let firstBossCleared = false;
  let previousBaseGapCenter = null;
  let flightTrail = [];
  let stageOrder = [];
  let stageIndex = 0;
  let stageElapsedSeconds = 0;
  let stageTransition = null;
  let backgroundScrollDistancePx = 0;
  let bossBackgroundScrollSpeed = null;
  let pendingStageAdvance = null;
  let bossEncounter = null;
  let challenge = null;
  let feedbackEffect = null;
  let nextAttackId = 1;
  let currentScrollSpeed = null;
  let speedTransition = null;
  let totalScrollDistancePx = 0;
  let lastSpecialBarrierWorldX = null;

  function getScore() {
    return scoreSession.score;
  }

  function getTargetDifficulty() {
    if (!warningSession) {
      const warningThreshold = bossEntry || bossPreview || pendingStageAdvance || stageTransition
        ? Number.MAX_SAFE_INTEGER : nextWarningScore;
      const base = getDifficulty(getScore(), elapsedSeconds, clearedBossCount, rng, null, warningThreshold, scoreSession.progressionScore, firstBossCleared, aircraft.id);
      return applyAircraftDifficulty(base);
    }

    const base = getDifficulty(
      getScore(),
      elapsedSeconds,
      clearedBossCount,
      rng,
      warningSession.bossPattern, nextWarningScore, scoreSession.progressionScore, firstBossCleared, aircraft.id,
    );
    const speedMultiplier = warningSession.isBoss
      ? getBossSpeedMultiplier(
        warningSession.bossPattern,
        Math.max(0, elapsedSeconds - (bossEncounter?.bossStartElapsedSeconds ?? elapsedSeconds)),
      )
      : 1;
    const baseSpeed = warningSession.isBoss
      ? bossEncounter?.baseScrollSpeed ?? base.baseSpeed
      : base.baseSpeed;

    return applyAircraftDifficulty({
      ...base,
      baseSpeed,
      warningIndex: warningSession.index,
      isWarning: !warningSession.isBoss,
      isBoss: warningSession.isBoss,
      bossPattern: warningSession.bossPattern,
      speedMultiplier,
      scrollSpeed: baseSpeed * speedMultiplier,
      gapHeight: base.gapHeight,
      specialChance: base.specialChance,
      movingGapChance: base.movingGapChance,
      timingWindowSeconds: base.timingWindowSeconds,
    });
  }

  function syncSpeedTransition(targetSpeed) {
    if (!Number.isFinite(targetSpeed) || targetSpeed <= 0) return;
    if (currentScrollSpeed === null || !Number.isFinite(currentScrollSpeed)) {
      currentScrollSpeed = targetSpeed;
      speedTransition = null;
      return;
    }

    if (speedTransition && Math.abs(speedTransition.targetSpeed - targetSpeed) < 0.001) return;
    if (!speedTransition && Math.abs(currentScrollSpeed - targetSpeed) < 0.001) return;

    speedTransition = {
      fromSpeed: currentScrollSpeed,
      targetSpeed,
      elapsedSeconds: 0,
      durationSeconds: SPEED_TRANSITION_SECONDS,
      direction: targetSpeed > currentScrollSpeed ? 'up' : 'down',
    };
  }

  function advanceSpeedTransition(deltaSeconds) {
    const target = getTargetDifficulty().scrollSpeed;
    syncSpeedTransition(target);
    if (!speedTransition) return;

    speedTransition.elapsedSeconds = Math.min(
      speedTransition.durationSeconds,
      speedTransition.elapsedSeconds + deltaSeconds,
    );
    const progress = speedTransition.elapsedSeconds / speedTransition.durationSeconds;
    const easedProgress = progress * progress * (3 - 2 * progress);
    currentScrollSpeed = speedTransition.fromSpeed
      + (speedTransition.targetSpeed - speedTransition.fromSpeed) * easedProgress;
    if (speedTransition.elapsedSeconds >= speedTransition.durationSeconds - 1e-9) {
      currentScrollSpeed = speedTransition.targetSpeed;
      speedTransition = null;
    }
  }

  function getCurrentDifficulty() {
    const target = getTargetDifficulty();
    syncSpeedTransition(target.scrollSpeed);
    return {
      ...target,
      targetScrollSpeed: target.scrollSpeed,
      scrollSpeed: currentScrollSpeed,
      effectiveSpeedMultiplier: target.baseSpeed > 0 ? currentScrollSpeed / target.baseSpeed : target.effectiveSpeedMultiplier,
    };
  }

  function applyAircraftDifficulty(difficulty) {
    const fastBossAdjustment = aircraft.id === 'velocity'
      && difficulty.isBoss
      && difficulty.speedMultiplier === 1.25
      ? VELOCITY_FAST_BOSS_SPEED_MULTIPLIER
      : 1;
    return {
      ...difficulty,
      aircraftId: aircraft.id,
      aircraftScrollSpeedMultiplier: aircraft.scrollSpeedMultiplier,
      aircraftSpawnIntervalMultiplier: aircraft.spawnIntervalMultiplier,
      speedAdjustmentMultiplier: fastBossAdjustment,
      effectiveSpeedMultiplier: difficulty.speedMultiplier
        * aircraft.scrollSpeedMultiplier * fastBossAdjustment,
      scrollSpeed: difficulty.scrollSpeed * aircraft.scrollSpeedMultiplier * fastBossAdjustment,
    };
  }

  function updateFlightTrail(deltaSeconds, scrollSpeed) {
    flightTrail = flightTrail
      .map((point) => ({
        x: point.x - scrollSpeed * deltaSeconds,
        y: point.y,
        ageSeconds: point.ageSeconds + deltaSeconds,
      }))
      .filter((point) => point.ageSeconds <= FLIGHT_TRAIL_LIFETIME_SECONDS && point.x >= -12);
    flightTrail.push({ x: player.x - player.width * 0.47, y: player.y, ageSeconds: 0 });
  }

  function startWarningIfNeeded() {
    if (warningSession || bossEntry || bossPreview || stageTransition || pendingStageAdvance) return;

    const candidate = getDifficulty(getScore(), elapsedSeconds, clearedBossCount, rng, null, nextWarningScore, scoreSession.progressionScore, firstBossCleared, aircraft.id);
    if (!candidate.isBoss) return;
    bossEntry = {
      phase: 'draining', elapsedSeconds: 0,
      warningIndex: candidate.warningIndex,
      pattern: candidate.bossPattern ?? chooseBossPattern(rng),
    };
  }

  function beginWarningSession(warningIndex, isBoss, bossPattern) {
    warningSession = {
      index: warningIndex,
      isBoss,
      bossPattern: isBoss ? bossPattern : null,
      targetCount: isBoss ? BOSS_OBSTACLE_COUNT : WARNING_OBSTACLE_COUNT,
      spawnedCount: 0,
      requiredSpecials: isBoss ? BOSS_MIN_SPECIALS : WARNING_MIN_SPECIALS,
      specialObstacleIds: new Set(),
      specialSpawnedCount: 0,
      waveComplete: false,
      laserPlan: undefined,
    };
    bossEncounter = isBoss
      ? createBossEncounter(warningIndex, getStageState().definition.id)
      : null;
    if (bossEncounter) {
      const entrySpeed = Number.isFinite(currentScrollSpeed) && currentScrollSpeed > 0
        ? currentScrollSpeed : getBaseSpeed(scoreSession.progressionScore, aircraft.id) * aircraft.scrollSpeedMultiplier;
      bossBackgroundScrollSpeed = entrySpeed;
      bossEncounter.backgroundScrollSpeed = entrySpeed;
      bossEncounter.baseScrollSpeed = getBaseSpeed(scoreSession.progressionScore, aircraft.id);
      bossEncounter.bossStartElapsedSeconds = elapsedSeconds;
      bossEncounter.patternQueue = createBossPatternRound(bossEncounter.number, rng);
    }
  }

  function updateBossPreview(deltaSeconds) {
    if (!bossEntry) return;
    if (bossEntry.phase === 'draining') {
      if (obstacles.length > 0 || ambientAttack) return;
      bossEntry.phase = 'darkening'; bossEntry.elapsedSeconds = 0;
      return;
    }
    bossEntry.elapsedSeconds += deltaSeconds;
    if (bossEntry.phase === 'darkening') {
      if (bossEntry.elapsedSeconds + 1e-9 < .4) return;
      bossEntry.phase = 'alert'; bossEntry.elapsedSeconds = 0;
      bossPreview = { warningIndex: bossEntry.warningIndex, pattern: bossEntry.pattern, remainingSeconds: BOSS_PATTERN_PREVIEW_SECONDS };
    } else if (bossEntry.phase === 'alert') {
      bossPreview.remainingSeconds = Math.max(0, BOSS_PATTERN_PREVIEW_SECONDS - bossEntry.elapsedSeconds);
      if (bossPreview.remainingSeconds > 1e-9) return;
      const { warningIndex, pattern } = bossEntry;
      bossPreview = null;
      bossEntry.phase = 'entering'; bossEntry.elapsedSeconds = 0;
      beginWarningSession(warningIndex, true, pattern);
    } else if (bossEntry.phase === 'entering' && bossEncounter?.entranceRemainingSeconds <= 0) bossEntry = null;
  }

  function getBossEntrySnapshot() {
    if (!bossEntry) return null;
    const smooth = p => { const t = Math.max(0, Math.min(1, p)); return t * t * (3 - 2 * t); };
    const darkness = bossEntry.phase === 'draining' ? 0 : bossEntry.phase === 'darkening'
      ? smooth(bossEntry.elapsedSeconds / .4) : bossEntry.phase === 'alert' ? 1
        : 1 - smooth(bossEntry.elapsedSeconds / (bossEncounter?.entranceDurationSeconds || 1));
    return { ...bossEntry, darkness };
  }

  function getLiveBossPose(motionSeconds = bossEncounter?.motionSeconds ?? 0, offsetSeconds = 0) {
    const animation = bossEncounter?.animation;
    const pose = getBossPose({ animation: animation ? { ...animation, elapsedSeconds: animation.elapsedSeconds + offsetSeconds } : null, idleElapsedSeconds: motionSeconds });
    if (bossEncounter?.attack?.type === 'volley' && animation?.kind !== 'hit') {
      const attackTime = bossEncounter.attack.elapsedSeconds + offsetSeconds;
      for (const projectile of bossEncounter.attack.projectiles) {
        const age = attackTime - projectile.delaySeconds - 1.1;
        if (age < 0) pose.charge = Math.max(pose.charge, Math.max(0, 1 + age / 1.1));
        else pose.fire = Math.max(pose.fire, Math.exp(-age * 8));
      }
    }
    return pose;
  }

  function getLiveBossGeometry(motionSeconds = bossEncounter?.motionSeconds ?? 0, offsetSeconds = 0) {
    const progress = bossEncounter ? 1 - bossEncounter.entranceRemainingSeconds / bossEncounter.entranceDurationSeconds : 1;
    return getBossGeometry(bossEncounter?.stageId, progress, motionSeconds, getBossRecoil(getLiveBossPose(motionSeconds, offsetSeconds)));
  }

  function spawnObstacle(difficulty) {
    const session = warningSession;
    const remainingSlots = session ? session.targetCount - session.spawnedCount : 0;
    const remainingSpecials = session
      ? Math.max(0, session.requiredSpecials - session.specialSpawnedCount)
      : 0;
    const spawnedNormalCount = session ? session.spawnedCount - session.specialSpawnedCount : 0;
    const remainingNormals = session?.isBoss
      ? Math.max(0, BOSS_ATTACK_NORMAL_WALL_COOLDOWN - spawnedNormalCount)
      : 0;
    const forceNormal = Boolean(session?.isBoss && remainingSlots <= remainingNormals);
    const forceSpecial = Boolean(session && remainingSlots <= remainingSpecials);
    let kind = forceNormal ? 'normal'
      : forceSpecial || shouldSpawnSpecial(rng, difficulty) ? 'special' : 'normal';
    if (kind === 'special' && firstBossCleared && safeRandom(rng) < 0.5) kind = 'hybrid';
    if (kind !== 'normal' && lastSpecialBarrierWorldX !== null) {
      const barrierX = getDashBarrierBounds({ x: OBSTACLE_SPAWN_X, kind,
        width: kind === 'hybrid' ? OBSTACLE_WIDTH : SPECIAL_OBSTACLE_WIDTH }).x;
      const speedBound = getBarrierSpeedBound({
        progressionScore: scoreSession.progressionScore,
        unpassedCount: obstacles.filter(wall => !wall.passed).length,
        distanceToPlayer: barrierX - player.x,
        minimumScrollSpeed: Math.min(difficulty.scrollSpeed, getBaseSpeed(scoreSession.progressionScore, aircraft.id) * .75 * aircraft.scrollSpeedMultiplier),
        minimumSpawnInterval: WARNING_SPAWN_INTERVAL_SECONDS * aircraft.spawnIntervalMultiplier,
        aircraftSpeedMultiplier: aircraft.scrollSpeedMultiplier, aircraftId: aircraft.id,
      });
      if (totalScrollDistancePx + barrierX - lastSpecialBarrierWorldX < speedBound * SPECIAL_RESPONSE_INTERVAL_SECONDS) {
        if (forceSpecial && !forceNormal) return false;
        kind = 'normal';
      }
    }
    const movingGap = kind === 'normal' && shouldSpawnMovingGap(rng, difficulty);
    const gapMotionCycleSeconds = movingGap
      ? (difficulty.isWarning || difficulty.isBoss
        ? WARNING_MOVING_GAP_CYCLE_SECONDS
        : NORMAL_MOVING_GAP_CYCLE_SECONDS)
      : null;
    const showTimingGuide = kind !== 'normal' && !firstBossCleared;
    let gapCenter = createGapCenter(difficulty.gapHeight, rng);
    if (previousBaseGapCenter !== null
      && (scoreSession.progressionScore >= GAP_CONTINUITY_SCORE || aircraft.id === 'velocity')) {
      gapCenter = constrainGapCenter(gapCenter, difficulty.gapHeight, previousBaseGapCenter);
    }
    const obstacle = createObstacle({
      id: `wall-${nextObstacleId++}`,
      x: OBSTACLE_SPAWN_X,
      gapCenter,
      gapHeight: difficulty.gapHeight,
      kind,
      warningIndex: session?.index ?? 0,
      movingGap,
      gapMotionPhase: movingGap ? safeRandom(rng) * Math.PI * 2 : null,
      gapMotionCycleSeconds,
      showTimingGuide,
      stageId: getStageState().definition.id,
      rng,
    });

    obstacle.bossNumber = session?.isBoss ? bossEncounter.number : null;
    obstacles.push(obstacle);
    if (isDashObstacle(obstacle)) lastSpecialBarrierWorldX = totalScrollDistancePx + getDashBarrierBounds(obstacle).x;
    previousBaseGapCenter = obstacle.baseGapCenter;
    if (session) {
      session.spawnedCount += 1;
      if (isDashObstacle(obstacle)) session.specialObstacleIds.add(obstacle.id);
      if (isDashObstacle(obstacle)) session.specialSpawnedCount += 1;
    }
    return true;
  }

  function updateSpawning(deltaSeconds, difficulty) {
    spawnAccumulatorSeconds += deltaSeconds;
    let activeDifficulty = difficulty;
    let interval = (warningSession ? WARNING_SPAWN_INTERVAL_SECONDS : NORMAL_SPAWN_INTERVAL_SECONDS)
      * aircraft.spawnIntervalMultiplier;

    while (spawnAccumulatorSeconds >= interval
      && (!warningSession || warningSession.spawnedCount < warningSession.targetCount)) {
      spawnAccumulatorSeconds -= interval;
      if (!spawnObstacle(activeDifficulty)) {
        // Retain the required quota slot, but never accumulate a catch-up burst.
        spawnAccumulatorSeconds = interval;
        break;
      }
      activeDifficulty = getCurrentDifficulty();
      interval = (warningSession ? WARNING_SPAWN_INTERVAL_SECONDS : NORMAL_SPAWN_INTERVAL_SECONDS)
        * aircraft.spawnIntervalMultiplier;
    }
  }

  function completeBossPattern() {
    if (!bossEncounter || bossEncounter.hp <= 0 || bossEncounter.cyclePhase === 'pending') return;
    const pattern = bossEncounter.patternQueue[bossEncounter.patternIndex];
    bossEncounter.completedPatterns.push(pattern);
    bossEncounter.lastPattern = pattern;
    bossEncounter.patternIndex++;
    bossEncounter.cyclePhase = 'pending';
    bossEncounter.wallSpawningPaused = true;
    spawnAccumulatorSeconds = 0;
    if (bossEncounter.patternIndex >= bossEncounter.patternQueue.length) {
      bossEncounter.cycleNumber++;
      bossEncounter.patternQueue = createBossPatternRound(bossEncounter.number, rng, pattern);
      bossEncounter.patternIndex = 0;
      bossEncounter.completedPatterns = [];
    }
  }

  function activateBossPattern() {
    if (bossEncounter.cyclePhase !== 'pending' || bossEncounter.weapon.firing || bossEncounter.hitEffect || obstacles.length) return;
    const pattern = bossEncounter.patternQueue[bossEncounter.patternIndex];
    bossEncounter.cyclePhase = pattern;
    spawnAccumulatorSeconds = 0;
    if (pattern === 'walls') {
      warningSession.spawnedCount = 0;
      warningSession.specialSpawnedCount = 0;
      warningSession.specialObstacleIds.clear();
      warningSession.waveComplete = false;
      warningSession.laserPlan = undefined;
      bossEncounter.singleLaserElapsedSeconds = 0;
      bossEncounter.volleyBudget = 1 + Math.floor(safeRandom(rng) * 3);
      bossEncounter.volleysFired = 0;
      bossEncounter.volleyElapsedSeconds = 0;
      bossEncounter.wallSpawningPaused = false;
    } else if (pattern === 'signature') {
      bossEncounter.signatureBudget = 1 + Math.floor(safeRandom(rng) * 3);
      bossEncounter.signaturesFired = 0;
    } else if (pattern === 'global') {
      bossEncounter.globalShotsRemaining = 1 + Math.floor(safeRandom(rng) * 3);
      startGlobalShot();
    } else if (pattern === 'challenge') beginBossRoar();
  }

  function processPassedObstacles() {
    const playerLeft = player.x - player.width / 2;
    const displayedDifficulty = getCurrentDifficulty();
    for (const obstacle of obstacles) {
      if (obstacle.x + obstacle.width >= playerLeft || obstacle.passed) continue;
      if (isDashObstacle(obstacle) && obstacle.showTimingGuide) {
        obstacle.timingGuideWidthPx = displayedDifficulty.scrollSpeed * displayedDifficulty.timingWindowSeconds;
      }
      obstacle.passed = true;
      const wasBossWall = obstacle.bossNumber !== null && obstacle.bossNumber !== undefined;
      if (!warningSession?.isBoss && !wasBossWall) advanceScore(scoreSession, obstacle.id);
      // Boss walls still resolve the wave even though they no longer award points.
      if (bossEncounter && obstacle.warningIndex === warningSession?.index) {
        if (obstacle.kind === 'normal') {
          advanceBossEncounter(bossEncounter, 'normal-wall-passed');
        } else {
          advanceBossEncounter(bossEncounter, 'special-resolved', elapsedSeconds);
        }
      }
      warningSession?.specialObstacleIds.delete(obstacle.id);
      startWarningIfNeeded();
    }

    if (warningSession
      && warningSession.spawnedCount === warningSession.targetCount
      && warningSession.specialObstacleIds.size === 0
      && !warningSession.isBoss) {
      nextWarningScore = getScore() + chooseWarningScoreStep(rng);
      warningSession = null;
      spawnAccumulatorSeconds = 0;
    }

    if (warningSession?.isBoss && warningSession.spawnedCount === warningSession.targetCount
      && warningSession.specialObstacleIds.size === 0) {
      const unresolvedBossWall = obstacles.some((obstacle) =>
        !obstacle.passed && obstacle.warningIndex === warningSession.index);
      if (!unresolvedBossWall) warningSession.waveComplete = true;
    }

    obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width >= 0);
  }

  function start(runOptions = {}) {
    const config=runOptions&&typeof runOptions==='object'?runOptions:{};
    if(Object.hasOwn(config,'guestMode'))guestMode=Boolean(config.guestMode);
    if(Object.hasOwn(config,'accountBestScore'))accountBestScore=Number.isFinite(Number(config.accountBestScore))?Math.max(0,Number(config.accountBestScore)):0;
    if(Object.hasOwn(config,'aircraftId'))aircraft=getAircraftDefinition(config.aircraftId);
    if(!canSelectAircraft(aircraft.id,{guestMode,bestScore:accountBestScore}))aircraft=getAircraftDefinition();
    player = createPlayer();
    scoreSession = { score: initialScore, progressionScore: initialScore, passedObstacleIds: new Set() };
    elapsedSeconds = 0;
    gameOverReason = null;
    deathEffect = null;
    obstacles = [];
    nextObstacleId = 1;
    spawnAccumulatorSeconds = NORMAL_SPAWN_INTERVAL_SECONDS * aircraft.spawnIntervalMultiplier;
    clearedBossCount = initialClearedBossCount;
    ambientLaserElapsedSeconds = 0;
    ambientAttack = null;
    warningSession = null;
    bossPreview = null;
    bossEntry = null;
    nextWarningScore = initialNextBossScore;
    firstBossCleared = initialClearedBossCount >= 1;
    previousBaseGapCenter = null;
    flightTrail = [];
    stageOrder = createStageShuffleBag(stageRng);
    stageIndex = 0;
    stageElapsedSeconds = 0;
    stageTransition = null;
    backgroundScrollDistancePx = 0;
    bossBackgroundScrollSpeed = null;
    pendingStageAdvance = null;
    bossEncounter = null;
    challenge = null;
    feedbackEffect = null;
    nextAttackId = 1;
    currentScrollSpeed = null;
    speedTransition = null;
    totalScrollDistancePx = 0;
    lastSpecialBarrierWorldX = null;
    lastUpdateMs = now();
    state = GAME_STATES.PLAYING;
    startWarningIfNeeded();
    getCurrentDifficulty();
  }

  function getStageState() {
    const stageId = stageOrder[stageIndex] ?? getStageDefinition().id;
    const definition = getStageDefinition(stageId);
    const mode = warningSession?.isBoss || pendingStageAdvance ? 'boss' : warningSession ? 'warning' : 'normal';
    return { definition, mode };
  }

  function getActiveBackgroundKey(definition, mode) {
    return mode === 'boss' ? definition.bossBackgroundKey : definition.backgroundKey;
  }

  function advanceStage() {
    const previous = getStageState();
    const wraps = stageIndex + 1 >= stageOrder.length;
    const order = wraps ? createStageShuffleBag(stageRng, previous.definition.id) : stageOrder;
    const index = wraps ? 0 : stageIndex + 1;
    const next = getStageDefinition(order[index]);
    pendingStageAdvance = {
      order, index, fromStageId: previous.definition.id, destinationStageId: next.id,
      fromKey: getActiveBackgroundKey(previous.definition, previous.mode),
      toKey: next.backgroundKey,
    };
    spawnAccumulatorSeconds = 0;
  }

  function updateStage(deltaSeconds, scrollSpeed) {
    stageElapsedSeconds += deltaSeconds;
    if (pendingStageAdvance && !stageTransition && obstacles.length === 0 && !ambientAttack) {
      stageTransition = createPortalTransition({ ...pendingStageAdvance, crossingX: player.x });
    }
    if (stageTransition) {
      advancePortalTransition(stageTransition, deltaSeconds, scrollSpeed);
      if (stageTransition.swapped && pendingStageAdvance) {
        stageOrder = pendingStageAdvance.order;
        stageIndex = pendingStageAdvance.index;
        pendingStageAdvance = null;
        bossBackgroundScrollSpeed = null;
        stageElapsedSeconds = 0;
      }
      if (stageTransition.phase === 'complete') {
        // Begin the new interval after arriving, excluding the clear reward and
        // accounting for any pause deduction during the portal, not at its swap.
        nextWarningScore = getScore() + chooseBossReentryScoreStep(rng);
        stageTransition = null;
      }
    }
  }

  function resolveChallenge() {
    if (!challenge || challenge.result === 'pending' || challenge.resolved) return;
    challenge.resolved = true;
    if (challenge.result === 'failure') feedbackEffect = createChallengeFailureEffect(rng);
    if (bossEncounter) {
      advanceBossEncounter(bossEncounter, challenge.result === 'success' ? 'challenge-success' : 'challenge-failure');
      advanceBossEncounter(bossEncounter, 'attack-resolved', elapsedSeconds);
      completeBossPattern();
    }
  }

  function beginBossRoar() {
    bossEncounter.cyclePhase = 'roar';
    bossEncounter.wallSpawningPaused = true;
    const id = `boss-roar-${nextAttackId++}`;
    bossEncounter.roar = { id, elapsedSeconds: 0, durationSeconds: BOSS_ROAR_SECONDS };
    bossEncounter.animation = { kind: 'roar', actionId: id, elapsedSeconds: 0, durationSeconds: BOSS_ROAR_SECONDS };
  }

  function startGlobalShot() {
    const laser = createQuarterLaser({
      rng, styleKey: getStageDefinition(bossEncounter.stageId).laserStyle,
      excludeSafeZone: bossEncounter.previousSafeZone,
      playerY: player.y, playerHeight: PLAYER_HITBOX_SIZE, liftSpeed: LIFT_VELOCITY * aircraft.liftMultiplier,
      gravity: gravity * aircraft.gravityMultiplier,
    });
    bossEncounter.previousSafeZone = laser.safeZone;
    bossEncounter.attack = { id: `boss-attack-${nextAttackId++}`, type: 'laser', ...laser };
    bossEncounter.wallSpawningPaused = true;
  }

  function launchSignatureAttack(wallShot = false) {
    const muzzle = getLiveBossGeometry().muzzle;
    bossEncounter.attack = createSignatureAttack({
      id: `boss-attack-${nextAttackId++}`, stageId: bossEncounter.stageId, bossNumber: bossEncounter.number,
      playerX: player.x, playerY: player.y, bossX: muzzle.x, bossY: muzzle.y, rng,
      projectileCount: wallShot ? 1 : undefined,
    });
    bossEncounter.wallSpawningPaused = !wallShot;
    bossEncounter.animation = { kind: 'attack', actionId: bossEncounter.attack.id, elapsedSeconds: 0,
      durationSeconds: bossEncounter.attack.durationSeconds };
  }

  function scheduleBossAttack(deltaSeconds = 0) {
    if (bossEntry || !bossEncounter || bossEncounter.hp <= 0 || !warningSession?.isBoss || bossEncounter.attack || bossEncounter.roar
      || challenge?.active) return;
    if (bossEncounter.entranceRemainingSeconds > 0) return;
    if (bossEncounter.cyclePhase === 'pending') activateBossPattern();
    if (bossEncounter.cyclePhase === 'signature') {
      if (bossEncounter.signaturesFired < bossEncounter.signatureBudget) {
        launchSignatureAttack();
        bossEncounter.signaturesFired++;
      } else completeBossPattern();
      return;
    }
    if (bossEncounter.cyclePhase !== 'walls') return;
    bossEncounter.volleyElapsedSeconds += deltaSeconds;
    const wallsFinished = warningSession.waveComplete && obstacles.length === 0;
    if (wallsFinished) {
      completeBossPattern();
      return;
    }
    if (bossEncounter.volleysFired < bossEncounter.volleyBudget
      && bossEncounter.volleyElapsedSeconds + 1e-9 >= BOSS_VOLLEY_INTERVAL_SECONDS) {
      // One shot during wall flight, independent of normal/special presence.
      launchSignatureAttack(true);
      bossEncounter.volleysFired++;
      bossEncounter.volleyElapsedSeconds = 0;
      return;
    }
    if (!warningSession.waveComplete) {
      bossEncounter.singleLaserElapsedSeconds += deltaSeconds;
      if (bossEncounter.singleLaserElapsedSeconds + 1e-9 < BOSS_SINGLE_LASER_INTERVAL_SECONDS) return;
      bossEncounter.singleLaserElapsedSeconds = 0;
      const activate = safeRandom(rng) < BOSS_SINGLE_LASER_CHANCE;
      if (!activate) return;
      const laser = prepareLineLaser();
      if (laser) {
        bossEncounter.attack = { id: `boss-attack-${nextAttackId++}`, type: 'laser', ...laser };
        // Pausing future spawns keeps a future opening from invalidating this warning.
        bossEncounter.wallSpawningPaused = true;
        spawnAccumulatorSeconds = 0;
      }
      return;
    }
  }

  function prepareLineLaser() {
    const difficulty = getCurrentDifficulty();
    const fastest = getBarrierSpeedBound({progressionScore:scoreSession.progressionScore,unpassedCount:obstacles.filter(w=>!w.passed).length,
      minimumScrollSpeed:difficulty.scrollSpeed,aircraftSpeedMultiplier:aircraft.scrollSpeedMultiplier,aircraftId:aircraft.id});
    const lifetime = BOSS_LASER_TELEGRAPH_SECONDS + BOSS_LASER_ACTIVE_SECONDS + BOSS_LASER_FADE_SECONDS;
    if (obstacles.some(wall => isDashObstacle(wall) && !wall.passed && !wall.barrierBroken
      && (getDashBarrierBounds(wall).x-player.x)/fastest <= lifetime+difficulty.timingWindowSeconds+.2)) return null;
    const gaps = obstacles.filter(wall => wall.kind === 'normal' || wall.kind === 'hybrid');
    if (!gaps.length) return null;
    return createSingleLaser({gaps,playerHeight:PLAYER_HITBOX_SIZE,rng,
      lineCount:safeRandom(rng)<BOSS_DOUBLE_LASER_CHANCE?2:1,styleKey:getStageState().definition.laserStyle});
  }

  function scheduleAmbientLaser(deltaSeconds) {
    if (clearedBossCount < AMBIENT_LASER_UNLOCK_BOSSES || ambientAttack || bossEncounter || bossEntry || bossPreview
      || stageTransition || pendingStageAdvance || challenge?.active) return;
    ambientLaserElapsedSeconds += deltaSeconds;
    if (ambientLaserElapsedSeconds + 1e-9 < AMBIENT_LASER_INTERVAL_SECONDS) return;
    ambientLaserElapsedSeconds = 0;
    if (safeRandom(rng) >= AMBIENT_LASER_CHANCE) return;
    const laser = prepareLineLaser();
    if (!laser) return;
    ambientAttack = {id:`ambient-laser-${nextAttackId++}`,type:'laser',...laser};
    spawnAccumulatorSeconds = 0;
  }

  function updateAmbientLaser(deltaSeconds) {
    if (!ambientAttack) return;
    updateLaser(ambientAttack,deltaSeconds);
    if (!invincibilityEnabled && intersectsPlayerLaser(player,ambientAttack,WORLD_HEIGHT)) {stop('laser');return;}
    if (ambientAttack.telegraphRemainingSeconds===0 && ambientAttack.activeRemainingSeconds===0 && ambientAttack.fadeRemainingSeconds===0) {
      ambientAttack = null; spawnAccumulatorSeconds = 0;
    }
  }

  function updateBossWeapon(weaponDeltaSeconds, deltaSeconds) {
    if (bossEncounter?.hp > 0 && bossEncounter.entranceRemainingSeconds <= 0) {
      const shotId = bossEncounter.weapon.firing?.id;
      const motionEnd = bossEncounter.motionSeconds;
      if (advanceBossWeapon(bossEncounter.weapon, weaponDeltaSeconds, ({shot,fromOffset,toOffset}) => intersectsBossBeam({
        shot,stageId:bossEncounter.stageId,
        fromMotionSeconds:motionEnd-weaponDeltaSeconds+fromOffset,
        toMotionSeconds:motionEnd-weaponDeltaSeconds+toOffset,
        poseAt:time=>getLiveBossPose(time,time-motionEnd),
      }))) {
        advanceBossEncounter(bossEncounter, 'laser-hit', aircraft.bossLaserDamage);
        bossEncounter.hitEffect = { remainingSeconds: .38, durationSeconds: .38 };
        bossEncounter.animation = { kind: 'hit', actionId: shotId, elapsedSeconds: 0, durationSeconds: .38 };
        if (bossEncounter.hp === 0) {
          bossEncounter.attack = null;
          bossEncounter.roar = null;
          bossEncounter.wallSpawningPaused = true;
          bossEncounter.cyclePhase = 'defeated';
        }
      }
    } else if (bossEncounter?.weapon.firing) {
      advanceBossWeapon(bossEncounter.weapon, deltaSeconds);
    }
  }

  function updateBossAttack(deltaSeconds, protectedSeconds = 0) {
    if (!bossEncounter?.attack) return;
    const attack = bossEncounter.attack;
    if (attack.type === 'volley') {
      updateSignatureAttack(attack, deltaSeconds, player, {
        projectileImmune: invincibilityEnabled, immuneSeconds: protectedSeconds,
        originAt: offset => getLiveBossGeometry(bossEncounter.motionSeconds - deltaSeconds + offset, offset - deltaSeconds).muzzle,
      });
      if (attack.hitPlayer && !invincibilityEnabled) { stop('projectile'); return; }
      if (attack.state === 'resolved') {
        bossEncounter.attack = null;
        bossEncounter.animation = { kind: 'idle', actionId: null, elapsedSeconds: 0, durationSeconds: 0 };
        bossEncounter.wallSpawningPaused = bossEncounter.cyclePhase !== 'walls';
      }
      return;
    }
    updateLaser(attack, deltaSeconds);
    if (!invincibilityEnabled && intersectsPlayerLaser(player, attack, WORLD_HEIGHT)) {
      stop('laser');
      return;
    }
    if (attack.telegraphRemainingSeconds === 0 && attack.activeRemainingSeconds === 0
      && attack.fadeRemainingSeconds === 0) {
      bossEncounter.attack = null;
      if (attack.kind === 'quarter') {
        bossEncounter.globalShotsRemaining -= 1;
        if (bossEncounter.globalShotsRemaining > 0) startGlobalShot();
        else completeBossPattern();
      } else {
        bossEncounter.wallSpawningPaused = false;
        spawnAccumulatorSeconds = 0;
      }
    }
  }

  function completeBossIfReady() {
    if (!bossEncounter || !warningSession?.isBoss || bossEncounter.hp > 0 || bossEncounter.attack
      || bossEncounter.weapon.firing || bossEncounter.hitEffect || challenge?.active) {
      return;
    }
    advanceBossEncounter(bossEncounter, 'boss-cleared');
    clearedBossCount++;
    if (bossEncounter.number === 1) firstBossCleared = true;
    scoreSession.score += 10;
    scoreSession.progressionScore += 10;
    advanceStage();
    warningSession = null;
    bossEncounter = null;
    spawnAccumulatorSeconds = 0;
  }

  function handleChallengeInput(code) {
    if (state !== GAME_STATES.PLAYING || deathEffect || !challenge?.active) return false;
    const result = handleChallengeKey(challenge, code);
    if (result === 'success' || result === 'failure') resolveChallenge();
    return result !== 'ignored';
  }

  function setAccountBestScore(bestScore) {
    if (state === GAME_STATES.PLAYING || state === GAME_STATES.PAUSED) {
      return accountBestScore;
    }
    accountBestScore = Math.max(0, Number(bestScore) || 0);
    if (!canSelectAircraft(aircraft.id,{guestMode,bestScore:accountBestScore})) {
      aircraft = getAircraftDefinition('default');
    }
    return accountBestScore;
  }

  function setAircraft(id) {
    if (state === GAME_STATES.PLAYING || state === GAME_STATES.PAUSED) {
      return false;
    }
    const definition = getAircraftDefinition(id);
    if (!canSelectAircraft(id,{guestMode,bestScore:accountBestScore})) return false;
    aircraft = definition;
    return aircraft.id;
  }

  function setGuestMode(enabled) {
    if (state === GAME_STATES.PLAYING || state === GAME_STATES.PAUSED) {
      return guestMode;
    }
    guestMode = Boolean(enabled);
    if (!canSelectAircraft(aircraft.id,{guestMode,bestScore:accountBestScore})) {
      aircraft = getAircraftDefinition('default');
    }
    return guestMode;
  }

  function setInvincibilityEnabled(enabled) {
    invincibilityEnabled = Boolean(enabled);
    return invincibilityEnabled;
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

    if (deathEffect) {
      deathEffect.elapsedSeconds = Math.min(
        deathEffect.durationSeconds,
        deathEffect.elapsedSeconds + deltaSeconds,
      );
      if (deathEffect.elapsedSeconds >= deathEffect.durationSeconds) state = GAME_STATES.GAME_OVER;
      return;
    }

    if (challenge?.active) {
      updateChallenge(challenge, deltaSeconds);
      resolveChallenge();
      return;
    }

    const liveRoar = bossEncounter?.roar;
    const previousPlayer = { ...player };
    const firing = bossEncounter?.weapon.firing;
    const lockedSeconds = firing ? Math.min(deltaSeconds, Math.max(0, firing.durationSeconds - firing.elapsedSeconds)) : 0;
    if (deltaSeconds > lockedSeconds) updatePlayer(player, deltaSeconds - lockedSeconds, gravity * aircraft.gravityMultiplier);
    elapsedSeconds += deltaSeconds;
    if (bossEncounter?.animation) bossEncounter.animation.elapsedSeconds += deltaSeconds;
    const previousBossEncounter = bossEncounter;
    const previousEntranceSeconds = bossEncounter?.entranceRemainingSeconds ?? 0;
    updateBossPreview(deltaSeconds);
    if (bossEncounter && bossEncounter === previousBossEncounter) {
      bossEncounter.entranceRemainingSeconds = Math.max(0, bossEncounter.entranceRemainingSeconds - deltaSeconds);
      bossEncounter.motionSeconds += Math.max(0, deltaSeconds - previousEntranceSeconds);
    }
    advanceSpeedTransition(deltaSeconds);
    let difficulty = getCurrentDifficulty();
    updateFlightTrail(deltaSeconds, difficulty.scrollSpeed);
    backgroundScrollDistancePx += (bossBackgroundScrollSpeed ?? difficulty.scrollSpeed) * deltaSeconds * 0.25;
    const wasTransitioning = Boolean(stageTransition);
    updateStage(deltaSeconds, difficulty.scrollSpeed);
    if (wasTransitioning && !stageTransition) {
      startWarningIfNeeded();
      const interval = (warningSession ? WARNING_SPAWN_INTERVAL_SECONDS : NORMAL_SPAWN_INTERVAL_SECONDS)
        * aircraft.spawnIntervalMultiplier;
      spawnAccumulatorSeconds = Math.max(0, interval - deltaSeconds);
    }
    difficulty = getCurrentDifficulty();
    if (stageTransition || pendingStageAdvance || bossEntry || ambientAttack) spawnAccumulatorSeconds = 0;
    else if (bossEncounter?.entranceRemainingSeconds > 0) spawnAccumulatorSeconds = 0;
    else if (!bossEncounter?.wallSpawningPaused) updateSpawning(deltaSeconds, difficulty);
    difficulty = getCurrentDifficulty();

    const previousObstacles = new Map();
    for (const obstacle of obstacles) {
      previousObstacles.set(obstacle.id, { ...obstacle });
      updateObstacle(obstacle, deltaSeconds, difficulty.scrollSpeed, elapsedSeconds);
      if (obstacle.breakEffect) {
        obstacle.breakEffect.remainingSeconds -= deltaSeconds;
        if (obstacle.breakEffect.remainingSeconds <= 0) delete obstacle.breakEffect;
      }
    }
    totalScrollDistancePx += difficulty.scrollSpeed * deltaSeconds;
    const protectedSeconds = player.isDashing ? player.dashRemainingSeconds : 0;
    advanceDash(player, deltaSeconds);
    if (bossEncounter?.hitEffect) {
      bossEncounter.hitEffect.remainingSeconds = Math.max(0, bossEncounter.hitEffect.remainingSeconds - deltaSeconds);
      if (bossEncounter.hitEffect.remainingSeconds === 0) bossEncounter.hitEffect = null;
    }
    const weaponDeltaSeconds = bossEncounter === previousBossEncounter
      ? Math.max(0, deltaSeconds - previousEntranceSeconds) : 0;
    updateAmbientLaser(deltaSeconds);
    if (deathEffect) return;
    updateBossAttack(deltaSeconds, protectedSeconds);
    if (deathEffect) return;
    if (feedbackEffect) {
      feedbackEffect.remainingSeconds = Math.max(0, feedbackEffect.remainingSeconds - deltaSeconds);
      if (feedbackEffect.remainingSeconds === 0) feedbackEffect = null;
    }

    if (isOutOfBounds(player, WORLD_HEIGHT)) {
      stop('boundary');
      return;
    }

    if (!invincibilityEnabled && obstacles.some((obstacle) => intersectsSweptPlayerObstacle(
      player, obstacle, previousPlayer, previousObstacles.get(obstacle.id), deltaSeconds,
    ))) {
      stop('obstacle');
      return;
    }

    updateBossWeapon(weaponDeltaSeconds, deltaSeconds);
    processPassedObstacles();
    completeBossIfReady();
    scheduleBossAttack(deltaSeconds);
    scheduleAmbientLaser(deltaSeconds);
    if (liveRoar && bossEncounter?.roar === liveRoar) {
      liveRoar.elapsedSeconds = Math.min(liveRoar.durationSeconds, liveRoar.elapsedSeconds + deltaSeconds);
      bossEncounter.animation.elapsedSeconds = liveRoar.elapsedSeconds;
      if (liveRoar.elapsedSeconds + 1e-9 >= liveRoar.durationSeconds && !bossEncounter.weapon.firing) {
        bossEncounter.roar = null;
        bossEncounter.cyclePhase = 'challenge';
        bossEncounter.animation = { kind: 'idle', actionId: null, elapsedSeconds: 0, durationSeconds: 0 };
        challenge = createChallenge({ bossNumber: bossEncounter.number, rng });
      }
    }
  }

  function pause() {
    if (deathEffect) return { score: getScore() };
    if (state !== GAME_STATES.PLAYING) {
      return { score: getScore() };
    }
    if (challenge?.active) return { score: getScore() };

    scoreSession.score = Math.max(0, getScore() - PAUSE_SCORE_PENALTY);
    state = GAME_STATES.PAUSED;
    return { score: getScore() };
  }

  function lift() {
    if (state !== GAME_STATES.PLAYING || deathEffect || challenge?.active || bossEncounter?.weapon.firing) return false;
    applyLift(player, LIFT_VELOCITY * aircraft.liftMultiplier);
    return true;
  }

  function dash() {
    if (state !== GAME_STATES.PLAYING || deathEffect) return false;
    if (challenge?.active || bossEncounter?.weapon.firing) return false;
    if (player.dashCooldownRemainingSeconds > 0) return false;
    const difficulty = getCurrentDifficulty();
    const target = obstacles
      .filter((obstacle) => isDashObstacle(obstacle) && !obstacle.barrierBroken && !obstacle.passed
        && getDashBarrierBounds(obstacle).x >= player.x)
      .sort((left, right) => getDashBarrierBounds(left).x - getDashBarrierBounds(right).x)[0];
    const bounds = getPlayerBounds(player);
    const insideGap = !target || target.kind !== 'hybrid'
      || (bounds.top >= target.gapCenter - target.gapHeight / 2
        && bounds.bottom <= target.gapCenter + target.gapHeight / 2);
    const isSpecialDash = target && insideGap && isSpecialTimingSuccess({
      playerX: player.x,
      wallX: getDashBarrierBounds(target).x,
      speed: difficulty.scrollSpeed,
      windowSeconds: difficulty.timingWindowSeconds,
    });
    startDash(player, DASH_DURATION_SECONDS, isSpecialDash ? target.id : null, isSpecialDash ? 'special' : 'normal');
    player.dashCooldownRemainingSeconds = DASH_COOLDOWN_SECONDS;
    if (isSpecialDash && target.kind === 'hybrid') {
      target.barrierBroken = true;
      target.barrierBreakY = player.y;
    }
    if (isSpecialDash) target.breakEffect = {
      centerY: player.y,
      remainingSeconds: SPECIAL_BREAK_DURATION_SECONDS,
      durationSeconds: SPECIAL_BREAK_DURATION_SECONDS,
      seed: safeRandom(rng) * Math.PI * 2,
    };
    return true;
  }

  function fire() {
    if (state !== GAME_STATES.PLAYING || deathEffect || challenge?.active || !bossEncounter
      || bossEncounter.hp <= 0 || bossEncounter.entranceRemainingSeconds > 0) return false;
    return startBossWeapon(bossEncounter.weapon, {
      id: `player-laser-${nextAttackId++}`, fromX: player.x, fromY: player.y, toX: WORLD_WIDTH, toY: player.y,
    });
  }

  function resume() {
    if (state !== GAME_STATES.PAUSED) {
      return;
    }

    lastUpdateMs = now();
    state = GAME_STATES.PLAYING;
  }

  function stop(reason = 'unknown') {
    if (state !== GAME_STATES.PLAYING || deathEffect) return;
    gameOverReason = reason;
    ambientAttack = null;
    ambientLaserElapsedSeconds = 0;
    bossPreview = null;
    bossEntry = null;
    deathEffect = {
      reason,
      elapsedSeconds: 0,
      durationSeconds: PLAYER_DEATH_EFFECT_SECONDS,
      x: player.x,
      y: player.y,
      aircraftId: aircraft.id,
    };
  }

  function getSnapshot() {
    const stageState = getStageState();
    const difficulty = getCurrentDifficulty();
    return {
      state,
      score: getScore(),
      progressionScore: scoreSession.progressionScore,
      baseScore: getScore(),
      scoreMultiplier: aircraft.scoreMultiplier,
      finalScore: Math.round(getScore() * aircraft.scoreMultiplier),
      clearedBossCount,
      ambientAttack: ambientAttack ? {...ambientAttack,ys:[...ambientAttack.ys]} : null,
      specialTimingGuideActive: !firstBossCleared,
      bossPreview: bossPreview ? { ...bossPreview } : null,
      bossEntry: getBossEntrySnapshot(),
      elapsedSeconds,
      backgroundScrollDistancePx,
      backgroundScrollSpeed: bossBackgroundScrollSpeed ?? difficulty.scrollSpeed,
      gameOverReason,
      invincibilityEnabled,
      deathEffect: deathEffect ? { ...deathEffect } : null,
      aircraft: {
        id: aircraft.id,
        name: aircraft.name,
        scoreMultiplier: aircraft.scoreMultiplier,
        gravityMultiplier: aircraft.gravityMultiplier,
        liftMultiplier: aircraft.liftMultiplier,
        speedCapScore: aircraft.speedCapScore,
        bossLaserDamage: aircraft.bossLaserDamage,
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
        patternQueue: [...bossEncounter.patternQueue],
        completedPatterns: [...bossEncounter.completedPatterns],
        geometry: getLiveBossGeometry(),
        pose: getLiveBossPose(),
        weapon: { ...bossEncounter.weapon, firing: bossEncounter.weapon.firing ? { ...bossEncounter.weapon.firing } : null },
        attack: bossEncounter.attack ? {
          ...bossEncounter.attack,
          ys: bossEncounter.attack.ys ? [...bossEncounter.attack.ys] : undefined,
          projectiles: bossEncounter.attack.projectiles?.map((shot) => ({
            ...shot, telegraphPoints: shot.telegraphPoints?.map((point) => ({ ...point })),
          })),
        } : null,
        animation: { ...bossEncounter.animation },
        roar: bossEncounter.roar ? { ...bossEncounter.roar } : null,
        counterattack: bossEncounter.counterattack ? { ...bossEncounter.counterattack } : null,
        hitEffect: bossEncounter.hitEffect ? { ...bossEncounter.hitEffect } : null,
      } : null,
      speedChange: speedTransition ? {
        direction: speedTransition.direction,
        remainingSeconds: Math.max(0, speedTransition.durationSeconds - speedTransition.elapsedSeconds),
      } : null,
      challenge: challenge ? { ...challenge, sequence: [...challenge.sequence] } : null,
      feedbackEffect: feedbackEffect ? { ...feedbackEffect } : null,
      player: { ...player },
      flightTrail: flightTrail.map((point) => ({ ...point })),
      obstacles: obstacles.map((obstacle) => ({ ...obstacle, breakEffect: obstacle.breakEffect ? { ...obstacle.breakEffect } : null })),
      difficulty: { ...difficulty },
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
    fire,
    pause,
    resume,
    stop,
    setAircraft,
    setAccountBestScore,
    setGuestMode,
    setInvincibilityEnabled,
    handleChallengeKey: handleChallengeInput,
    getSnapshot,
  };
}

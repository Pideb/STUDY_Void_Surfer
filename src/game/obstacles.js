import { MOVING_GAP_AMPLITUDE, OBSTACLE_WIDTH, SPECIAL_OBSTACLE_WIDTH, WORLD_HEIGHT } from './constants.js';

export function isDashObstacle(obstacle) {
  return obstacle?.kind === 'special' || obstacle?.kind === 'hybrid';
}

export function getDashBarrierBounds(obstacle) {
  const width = obstacle.kind === 'hybrid' ? SPECIAL_OBSTACLE_WIDTH : obstacle.width;
  return { x: obstacle.x + (obstacle.width - width) / 2, width };
}

function clampGapCenter(gapCenter, gapHeight) {
  const halfGap = gapHeight / 2;
  const safeCenter = Number.isFinite(gapCenter) ? gapCenter : WORLD_HEIGHT / 2;
  return Math.min(WORLD_HEIGHT - halfGap, Math.max(halfGap, safeCenter));
}

export function createObstacle({
  id,
  x,
  gapCenter,
  gapHeight,
  kind = 'normal',
  warningIndex = 0,
  movingGap = false,
  gapMotionPhase = null,
  gapMotionAmplitude = MOVING_GAP_AMPLITUDE,
  gapMotionCycleSeconds = null,
  showTimingGuide = false,
  stageId = null,
  encounterCycleId = null,
  rng = Math.random,
}) {
  if (!id) {
    throw new TypeError('장애물 id가 필요합니다.');
  }

  const safeGapHeight = Math.max(1, Math.min(WORLD_HEIGHT, Number(gapHeight) || 1));
  const normalizedKind = ['special', 'hybrid'].includes(kind) ? kind : 'normal';
  const canMoveGap = normalizedKind === 'normal' && Boolean(movingGap);
  const requestedAmplitude = Number.isFinite(gapMotionAmplitude)
    ? Math.max(0, gapMotionAmplitude)
    : MOVING_GAP_AMPLITUDE;
  const safeCycle = Number.isFinite(gapMotionCycleSeconds) && gapMotionCycleSeconds > 0
    ? gapMotionCycleSeconds
    : null;
  const safeAmplitude = Math.min(requestedAmplitude, (WORLD_HEIGHT - safeGapHeight) / 2);
  const baseGapCenter = Math.max(safeGapHeight / 2 + (canMoveGap ? safeAmplitude : 0),
    Math.min(WORLD_HEIGHT - safeGapHeight / 2 - (canMoveGap ? safeAmplitude : 0), clampGapCenter(gapCenter, safeGapHeight)));
  const safePhase = Number.isFinite(gapMotionPhase)
    ? gapMotionPhase
    : (Number(rng()) || 0) * Math.PI * 2;

  return {
    id,
    x,
    width: normalizedKind === 'special' ? SPECIAL_OBSTACLE_WIDTH : OBSTACLE_WIDTH,
    gapCenter: baseGapCenter + (canMoveGap && safeCycle ? safeAmplitude * Math.sin(safePhase) : 0),
    baseGapCenter,
    motionAgeSeconds: 0,
    motionFrozen: false,
    motionCenter: baseGapCenter,
    motionPhase: safePhase,
    gapHeight: safeGapHeight,
    kind: normalizedKind,
    barrierBroken: false,
    barrierBreakY: null,
    warningIndex: Math.max(0, Math.trunc(warningIndex)),
    movingGap: canMoveGap,
    gapMotionPhase: canMoveGap ? safePhase : null,
    gapMotionAmplitude: canMoveGap ? safeAmplitude : 0,
    gapMotionCycleSeconds: canMoveGap ? safeCycle : null,
    showTimingGuide: normalizedKind !== 'normal' && Boolean(showTimingGuide),
    timingGuideWidthPx: null,
    stageId: typeof stageId === 'string' && stageId.length > 0 ? stageId : null,
    encounterCycleId: Number.isInteger(encounterCycleId) && encounterCycleId > 0 ? encounterCycleId : null,
    visualSeed: Number(rng()) || 0,
    passed: false,
  };
}

// Integral of smoothstep over the final 40px before the 160px stop boundary.
function motionDistance(distance) {
  if (distance <= 0) return 0;
  if (distance >= 40) return distance - 20;
  const u = distance / 40;
  return 40 * (u ** 3 - 0.5 * u ** 4);
}

export function updateObstacle(obstacle, deltaSeconds, speed, elapsedSeconds, options = {}) {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0 || !Number.isFinite(speed)) {
    return obstacle;
  }

  const previousX = obstacle.x;
  obstacle.x -= speed * deltaSeconds;
  if (!obstacle.movingGap
    || obstacle.motionFrozen
    || !Number.isFinite(obstacle.baseGapCenter)
    || !Number.isFinite(obstacle.gapMotionPhase)
    || !Number.isFinite(obstacle.gapMotionAmplitude)
    || !Number.isFinite(obstacle.gapMotionCycleSeconds)
    || obstacle.gapMotionCycleSeconds <= 0) {
    return obstacle;
  }

  let motionDelta = deltaSeconds;
  if (Number.isFinite(options.playerDamageFront)) {
    const before = previousX - options.playerDamageFront - 160;
    const after = obstacle.x - options.playerDamageFront - 160;
    const u = Math.max(0, Math.min(1, before / 40));
    motionDelta = speed > 0 ? (motionDistance(before) - motionDistance(after)) / speed
      : deltaSeconds * u * u * (3 - 2 * u);
    if (after <= 0) obstacle.motionFrozen = true;
  }
  obstacle.motionAgeSeconds += Math.max(0, motionDelta);
  const phase = (Math.PI * 2 * obstacle.motionAgeSeconds / obstacle.gapMotionCycleSeconds)
    + obstacle.gapMotionPhase;
  obstacle.gapCenter = clampGapCenter(
    obstacle.baseGapCenter + obstacle.gapMotionAmplitude * Math.sin(phase),
    obstacle.gapHeight,
  );
  return obstacle;
}

import { MOVING_GAP_AMPLITUDE, OBSTACLE_WIDTH, SPECIAL_OBSTACLE_WIDTH, WORLD_HEIGHT } from './constants.js';

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
  rng = Math.random,
}) {
  if (!id) {
    throw new TypeError('장애물 id가 필요합니다.');
  }

  const safeGapHeight = Math.max(1, Math.min(WORLD_HEIGHT, Number(gapHeight) || 1));
  const normalizedKind = kind === 'special' ? 'special' : 'normal';
  const canMoveGap = normalizedKind === 'normal' && Boolean(movingGap);
  const baseGapCenter = clampGapCenter(gapCenter, safeGapHeight);
  const safeAmplitude = Number.isFinite(gapMotionAmplitude)
    ? Math.max(0, gapMotionAmplitude)
    : MOVING_GAP_AMPLITUDE;
  const safeCycle = Number.isFinite(gapMotionCycleSeconds) && gapMotionCycleSeconds > 0
    ? gapMotionCycleSeconds
    : null;
  const safePhase = Number.isFinite(gapMotionPhase)
    ? gapMotionPhase
    : Number(rng()) * Math.PI * 2;

  return {
    id,
    x,
    width: normalizedKind === 'special' ? SPECIAL_OBSTACLE_WIDTH : OBSTACLE_WIDTH,
    gapCenter: baseGapCenter,
    baseGapCenter,
    gapHeight: safeGapHeight,
    kind: normalizedKind,
    warningIndex: Math.max(0, Math.trunc(warningIndex)),
    movingGap: canMoveGap,
    gapMotionPhase: canMoveGap ? safePhase : null,
    gapMotionAmplitude: canMoveGap ? safeAmplitude : 0,
    gapMotionCycleSeconds: canMoveGap ? safeCycle : null,
    showTimingGuide: normalizedKind === 'special' && Boolean(showTimingGuide),
    visualSeed: Number(rng()) || 0,
    passed: false,
  };
}

export function updateObstacle(obstacle, deltaSeconds, speed, elapsedSeconds) {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0 || !Number.isFinite(speed)) {
    return obstacle;
  }

  obstacle.x -= speed * deltaSeconds;
  if (!obstacle.movingGap
    || !Number.isFinite(elapsedSeconds)
    || !Number.isFinite(obstacle.baseGapCenter)
    || !Number.isFinite(obstacle.gapMotionPhase)
    || !Number.isFinite(obstacle.gapMotionAmplitude)
    || !Number.isFinite(obstacle.gapMotionCycleSeconds)
    || obstacle.gapMotionCycleSeconds <= 0) {
    return obstacle;
  }

  const phase = (Math.PI * 2 * elapsedSeconds / obstacle.gapMotionCycleSeconds)
    + obstacle.gapMotionPhase;
  obstacle.gapCenter = clampGapCenter(
    obstacle.baseGapCenter + obstacle.gapMotionAmplitude * Math.sin(phase),
    obstacle.gapHeight,
  );
  return obstacle;
}

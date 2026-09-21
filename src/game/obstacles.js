import { OBSTACLE_WIDTH, WORLD_HEIGHT } from './constants.js';

function clampGapCenter(gapCenter, gapHeight) {
  const halfGap = gapHeight / 2;
  return Math.min(WORLD_HEIGHT - halfGap, Math.max(halfGap, gapCenter));
}

export function createObstacle({
  id,
  x,
  gapCenter,
  gapHeight,
  kind = 'normal',
  warningIndex = 0,
  rng = Math.random,
}) {
  if (!id) {
    throw new TypeError('장애물 id가 필요합니다.');
  }

  const safeGapHeight = Math.max(1, Math.min(WORLD_HEIGHT, gapHeight));

  return {
    id,
    x,
    width: OBSTACLE_WIDTH,
    gapCenter: clampGapCenter(gapCenter, safeGapHeight),
    gapHeight: safeGapHeight,
    kind: kind === 'special' ? 'special' : 'normal',
    warningIndex: Math.max(0, Math.trunc(warningIndex)),
    visualSeed: Number(rng()) || 0,
    passed: false,
  };
}

export function updateObstacle(obstacle, deltaSeconds, speed) {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0 || !Number.isFinite(speed)) {
    return obstacle;
  }

  obstacle.x -= speed * deltaSeconds;
  return obstacle;
}

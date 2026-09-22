import { DASH_DURATION_SECONDS, WORLD_HEIGHT } from './constants.js';

function getPlayerBounds(player) {
  return {
    left: player.x - player.width / 2,
    right: player.x + player.width / 2,
    top: player.y - player.height / 2,
    bottom: player.y + player.height / 2,
  };
}

function overlapsHorizontal(playerBounds, obstacle) {
  return playerBounds.right > obstacle.x && playerBounds.left < obstacle.x + obstacle.width;
}

export function intersectsPlayerObstacle(player, obstacle) {
  if (!overlapsHorizontal(getPlayerBounds(player), obstacle)) {
    return false;
  }

  if (player.isDashing && player.dashKind === 'special'
    && player.dashTargetId && obstacle.kind === 'special'
    && player.dashTargetId === obstacle.id) {
    return false;
  }

  if (obstacle.kind === 'special') {
    return true;
  }

  const bounds = getPlayerBounds(player);
  const gapTop = obstacle.gapCenter - obstacle.gapHeight / 2;
  const gapBottom = obstacle.gapCenter + obstacle.gapHeight / 2;
  const overlapsTopSolid = bounds.top < gapTop;
  const overlapsBottomSolid = bounds.bottom > gapBottom && bounds.top < WORLD_HEIGHT;

  return overlapsTopSolid || overlapsBottomSolid;
}

export function isSpecialTimingSuccess({ playerX, wallX, speed, windowSeconds }) {
  if (![playerX, wallX, speed, windowSeconds].every(Number.isFinite) || speed <= 0 || windowSeconds < 0) {
    return false;
  }

  const timeUntilWall = (wallX - playerX) / speed;
  return timeUntilWall >= 0 && timeUntilWall <= windowSeconds;
}

export function startDash(player, durationSeconds = DASH_DURATION_SECONDS, obstacleId = null, dashKind = 'normal') {
  const safeDuration = Number.isFinite(durationSeconds) ? Math.max(0, durationSeconds) : 0;
  const isSpecialDash = dashKind === 'special' && typeof obstacleId === 'string' && obstacleId.length > 0;
  player.isDashing = safeDuration > 0;
  player.dashRemainingSeconds = safeDuration;
  player.dashTargetId = player.isDashing && isSpecialDash ? obstacleId : null;
  player.dashKind = player.isDashing ? (isSpecialDash ? 'special' : 'normal') : 'none';
  return player;
}

export function advanceDash(player, deltaSeconds) {
  if (!player.isDashing || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    return player;
  }

  player.dashRemainingSeconds = Math.max(0, (player.dashRemainingSeconds ?? 0) - deltaSeconds);
  if (player.dashRemainingSeconds === 0) {
    player.isDashing = false;
    player.dashTargetId = null;
    player.dashKind = 'none';
  }

  return player;
}

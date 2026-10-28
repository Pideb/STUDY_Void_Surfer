import {
  BOSS_LASER_THICKNESS,
  DASH_DURATION_SECONDS,
  WORLD_HEIGHT,
} from './constants.js';
import { getLaserFrontX } from './boss-attacks.js';
import { getDashBarrierBounds, isDashObstacle } from './obstacles.js';
import { getPlayerBounds, getSpecialSuccessBounds } from './player-geometry.js';
export { getPlayerBounds } from './player-geometry.js';

function overlapsHorizontal(playerBounds, obstacle) {
  return Boolean(playerBounds && playerBounds.right > obstacle.x && playerBounds.left < obstacle.x + obstacle.width);
}

export function intersectsPlayerObstacle(player, obstacle) {
  if (!overlapsHorizontal(getPlayerBounds(player), obstacle)) {
    return false;
  }

  const targetedDash = player.isDashing && player.dashKind === 'special'
    && player.dashTargetId && isDashObstacle(obstacle)
    && player.dashTargetId === obstacle.id;

  if (obstacle.kind === 'special') {
    return !targetedDash;
  }

  const bounds = getPlayerBounds(player);
  const gapTop = obstacle.gapCenter - obstacle.gapHeight / 2;
  const gapBottom = obstacle.gapCenter + obstacle.gapHeight / 2;
  const overlapsTopSolid = bounds.top < gapTop;
  const overlapsBottomSolid = bounds.bottom > gapBottom && bounds.top < WORLD_HEIGHT;

  if (overlapsTopSolid || overlapsBottomSolid) return true;
  if (obstacle.kind === 'hybrid') {
    return !obstacle.barrierBroken && !targetedDash
      && overlapsHorizontal(bounds, getDashBarrierBounds(obstacle));
  }
  return false;
}

// The smaller body must still catch a thin wall that crosses it between frames.
function horizontalContactInterval(player, wall, previousPlayer, previousWall) {
  const old = getPlayerBounds(previousPlayer), current = getPlayerBounds(player);
  if (!old || !current) return null;
  const from = previousWall.x - previousPlayer.x, to = wall.x - player.x;
  const low = old.left - previousPlayer.x - wall.width, high = old.right - previousPlayer.x;
  if (from === to) return from > low && from < high ? [0, 1] : null;
  const a = (low - from) / (to - from), b = (high - from) / (to - from);
  const enter = Math.max(0, Math.min(a, b)), exit = Math.min(1, Math.max(a, b));
  return enter < exit ? [enter, exit] : null;
}

export function intersectsSweptPlayerObstacle(player, obstacle, previousPlayer, previousObstacle, deltaSeconds) {
  if (!previousPlayer || !previousObstacle) return intersectsPlayerObstacle(player, obstacle);
  const interval = horizontalContactInterval(player, obstacle, previousPlayer, previousObstacle);
  if (!interval) return false;
  const old = getPlayerBounds(previousPlayer), current = getPlayerBounds(player);
  if (obstacle.kind !== 'special') {
    const halfGap = obstacle.gapHeight / 2;
    // Linear in-frame motion: a solid is entered if either end of the contact
    // interval is outside the opening. Endpoints also cover a complete crossing.
    const hitsSolid = interval.some(t => {
      const top = old.top + (current.top - old.top) * t;
      const bottom = old.bottom + (current.bottom - old.bottom) * t;
      const gap = previousObstacle.gapCenter + (obstacle.gapCenter - previousObstacle.gapCenter) * t;
      return top < gap - halfGap || (bottom > gap + halfGap && top < WORLD_HEIGHT);
    });
    if (hitsSolid) return true;
    if (obstacle.kind !== 'hybrid' || obstacle.barrierBroken) return false;
  }
  const barrier = getDashBarrierBounds(obstacle), oldBarrier = getDashBarrierBounds(previousObstacle);
  const barrierInterval = horizontalContactInterval(player, barrier, previousPlayer, oldBarrier);
  if (!barrierInterval) return false;
  const protectedThroughout = previousPlayer.isDashing && previousPlayer.dashKind === 'special'
    && previousPlayer.dashTargetId === obstacle.id
    && previousPlayer.dashRemainingSeconds + 1e-9 >= barrierInterval[1] * deltaSeconds;
  return !protectedThroughout;
}

export function isSpecialTimingSuccess({ playerX, wallX, speed, windowSeconds }) {
  if (![playerX, wallX, speed, windowSeconds].every(Number.isFinite) || speed <= 0 || windowSeconds < 0) {
    return false;
  }

  const player = { x: playerX, y: 0 };
  const damage = getPlayerBounds(player), success = getSpecialSuccessBounds(player);
  return damage.right <= wallX
    && success.right >= wallX - speed * windowSeconds
    && success.left <= wallX;
}

export function isProjectileReflectionSuccess({ player, projectile }) {
  if (!player || !projectile || projectile.state !== 'flying') return false;
  const horizontalWindow = projectile.speed * projectile.reflectionWindowSeconds;
  const verticalWindow = player.height / 2 + 30;
  return Math.abs(projectile.x - player.x) <= horizontalWindow
    && Math.abs(projectile.y - player.y) <= verticalWindow;
}

export function intersectsPlayerLaser(player, laser, worldHeight = WORLD_HEIGHT) {
  if (!player || !laser || laser.telegraphRemainingSeconds > 0 || laser.activeRemainingSeconds <= 0) {
    return false;
  }

  const bounds = getPlayerBounds(player);
  if (!bounds) return false;
  if (bounds.right < getLaserFrontX(laser)) return false;

  if (laser.kind === 'quarter') {
    const zoneHeight = laser.zoneHeight || worldHeight / 4;
    const safeTop = laser.safeZone * zoneHeight;
    return bounds.top < safeTop || bounds.bottom > safeTop + zoneHeight;
  }

  const thickness = laser.thickness || BOSS_LASER_THICKNESS;
  return (laser.ys ?? [laser.y]).some(y => bounds.top <= y + thickness / 2 && bounds.bottom >= y - thickness / 2);
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
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    return player;
  }
  player.dashCooldownRemainingSeconds = Math.max(0, (player.dashCooldownRemainingSeconds ?? 0) - deltaSeconds);
  if (player.dashCooldownRemainingSeconds < 1e-9) player.dashCooldownRemainingSeconds = 0;
  if (!player.isDashing) return player;

  player.dashRemainingSeconds = Math.max(0, (player.dashRemainingSeconds ?? 0) - deltaSeconds);
  if (player.dashRemainingSeconds === 0) {
    player.isDashing = false;
    player.dashTargetId = null;
    player.dashKind = 'none';
  }

  return player;
}

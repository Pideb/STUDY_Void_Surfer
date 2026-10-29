import {
  PLAYER_START_X,
  PLAYER_START_Y,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants.js';
import { getStageDefinition, STAGE_IDS } from './stages.js';
import { getPlayerBounds } from './player-geometry.js';

const CHARGE_SECONDS = 1.1;
const HALF_WIDTH = 8;
const HALF_HEIGHT = 5.5;
const PATH_SEGMENTS = 32;
const EPSILON = 1e-9;

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;

function pattern(stageId, bossNumber, count) {
  const side = bossNumber % 2 === 0 ? 1 : -1;
  const indices = Array.from({ length: count }, (_, index) => index);
  const lane = (index, extent) => -extent + 2 * extent * index / (count - 1);
  switch (stageId) {
    case STAGE_IDS.INDUSTRIAL_VOID:
      return indices.map((index) => ({
        offset: side * (index % 2 === 0 ? 104 : -104), delay: index * 0.28, curve: 0,
      }));
    case STAGE_IDS.SIGNAL_MONOLITHS:
      return indices.map((index) => ({ offset: lane(index, 112), delay: index * 0.36, curve: 0 }));
    case STAGE_IDS.GRAVITY_WELL:
      return indices.map((index) => ({ offset: 0, delay: 0, curve: lane(index, 120) || 40 }));
    case STAGE_IDS.ABYSSAL_BEAST:
      return indices.map((index) => {
        const direction = side * (index % 2 === 0 ? 1 : -1);
        return {
          offset: direction * (index < 2 ? 112 : 56), delay: index * 0.32,
          curve: direction * (88 + 24 * Math.floor(index / 2)),
        };
      });
    case STAGE_IDS.SOLAR_FORGE:
      return indices.map((index) => ({ offset: lane(index, 108), delay: index * 0.16, curve: 0 }));
    default:
      return indices.map((index) => ({ offset: lane(index, 144), delay: 0, curve: 0 }));
  }
}

/**
 * baseSpeed is intentionally ignored: signatures use 220..360 world px/s even
 * at the scroll-speed ceiling. Wall-free volleys choose3..6 shots; explicit1
 * selects one traditional stage path during wall flight. Delays start after1.1s.
 * Projectile elapsedSeconds is its clock after delay; both hit flags are sticky.
 * durationSeconds is an upper bound through the left world edge.
 */
export function createSignatureAttack({
  id = 'signature-1', stageId, bossNumber = 1,
  playerX = PLAYER_START_X, playerY = PLAYER_START_Y,
  bossX = 750, bossY = 270, rng = Math.random, projectileCount,
} = {}) {
  const stage = getStageDefinition(stageId);
  const originX = clamp(finite(bossX, 750), HALF_WIDTH, WORLD_WIDTH);
  const originY = clamp(finite(bossY, 270), HALF_HEIGHT, WORLD_HEIGHT - HALF_HEIGHT);
  const targetX = clamp(finite(playerX, PLAYER_START_X), 0, originX - 1);
  // Shift the whole fan near an edge so announced lanes remain distinct.
  const centerY = clamp(finite(playerY, PLAYER_START_Y), 168, WORLD_HEIGHT - 168);
  const number = Math.max(1, Math.floor(finite(bossNumber, 1)));
  const sampleCount = () => 3 + Math.floor(clamp(typeof rng === 'function' ? finite(rng(), .5) : .5, 0, .999999) * 4);
  const single = projectileCount === 1;
  const traditionalCount = stage.id === STAGE_IDS.CRYSTAL_GATES ? 5 : stage.id === STAGE_IDS.SOLAR_FORGE ? 4 : 3;
  const count = single ? traditionalCount
    : Number.isInteger(projectileCount) && projectileCount >= 3 && projectileCount <= 6 ? projectileCount : sampleCount();
  let trajectories = pattern(stage.id, number, count);
  if (single) {
    const sample = typeof rng === 'function' ? finite(rng(), .5) : .5;
    trajectories = [{ ...trajectories[Math.floor(clamp(sample, 0, .999999) * trajectories.length)], delay: 0 }];
  }
  const projectiles = trajectories.map(({ offset, delay, curve }, index) => {
    const sample = typeof rng === 'function' ? finite(rng(), 0.5) : 0.5;
    const projectile = {
      id: `${id}-${index + 1}`, type: 'projectile', stageId: stage.id,
      styleKey: stage.projectileStyle, kind: curve === 0 ? 'direct' : 'parabolic',
      x: originX, y: originY, previousX: originX, previousY: originY,
      bossX: originX, bossY: originY, startY: originY,
      targetX, targetY: centerY + offset,
      speed: 220 + clamp(sample, 0, 1) * 140,
      curveAmplitude: curve, delaySeconds: delay, elapsedSeconds: 0,
      chargeRemainingSeconds: CHARGE_SECONDS, state: 'charging', hitPlayer: false,
      telegraphPoints: [],
    };
    projectile.telegraphPoints = Array.from({ length: PATH_SEGMENTS + 1 }, (_, step) => {
      const progress = step / PATH_SEGMENTS;
      return {
        x: originX + (targetX - originX) * progress,
        y: originY + (projectile.targetY - originY) * progress
          + Math.sin(progress * Math.PI) * curve,
      };
    });
    return projectile;
  });
  return {
    id, type: 'volley', stageId: stage.id, state: 'charging', elapsedSeconds: 0,
    chargeSeconds: CHARGE_SECONDS, projectiles, hitPlayer: false,
    durationSeconds: Math.max(...projectiles.map((projectile) =>
      CHARGE_SECONDS + projectile.delaySeconds + (originX + HALF_WIDTH) / projectile.speed)),
  };
}

function playerBounds(player) {
  if (!player || ![player.x, player.y, player.width, player.height].every(Number.isFinite)
    || player.width <= 0 || player.height <= 0) return null;
  const bounds = getPlayerBounds(player);
  return Object.values(bounds).every(Number.isFinite) && bounds.right >= bounds.left ? bounds : null;
}

// Slab intersection against the player's AABB expanded by the projectile body.
// Return the first contact along the segment, including stationary/tangent hits.
function contactTime(from, to, bounds) {
  if (!bounds) return null;
  let entry = 0;
  let exit = 1;
  for (const [axis, low, high] of [
    ['x', bounds.left - HALF_WIDTH, bounds.right + HALF_WIDTH],
    ['y', bounds.top - HALF_HEIGHT, bounds.bottom + HALF_HEIGHT],
  ]) {
    const distance = to[axis] - from[axis];
    if (distance === 0) {
      if (from[axis] < low || from[axis] > high) return null;
    } else {
      const first = (low - from[axis]) / distance;
      const last = (high - from[axis]) / distance;
      entry = Math.max(entry, Math.min(first, last));
      exit = Math.min(exit, Math.max(first, last));
      if (entry > exit) return null;
    }
  }
  return entry;
}

function pointAtX(projectile, x) {
  const progress = Math.max(0, (projectile.bossX - x) / (projectile.bossX - projectile.targetX));
  const position = progress * PATH_SEGMENTS;
  const index = Math.min(PATH_SEGMENTS - 1, Math.floor(position));
  const from = projectile.telegraphPoints[index];
  const to = projectile.telegraphPoints[index + 1];
  return { x, y: from.y + (to.y - from.y) * (position - index) };
}

function moveProjectile(projectile, flightSeconds, bounds) {
  const exitX = -HALF_WIDTH;
  const nextX = Math.min(projectile.x, Math.max(exitX, projectile.bossX - projectile.speed * flightSeconds));
  projectile.previousX = projectile.x;
  projectile.previousY = projectile.y;
  // Traverse the actual announced polyline. Work is bounded by the path size,
  // even for enormous deltas, and curved paths cannot tunnel through the player.
  const points = projectile.telegraphPoints.filter((point) => point.x < projectile.x && point.x > nextX);
  points.push(pointAtX(projectile, nextX));
  for (const point of points) {
    const from = { x: projectile.x, y: projectile.y };
    let edge = 1;
    if (point.y < -HALF_HEIGHT) edge = (-HALF_HEIGHT - from.y) / (point.y - from.y);
    if (point.y > WORLD_HEIGHT + HALF_HEIGHT) {
      edge = (WORLD_HEIGHT + HALF_HEIGHT - from.y) / (point.y - from.y);
    }
    const to = { x: from.x + (point.x - from.x) * edge, y: from.y + (point.y - from.y) * edge };
    const contact = contactTime(from, to, bounds);
    if (contact !== null) {
      projectile.x = from.x + (to.x - from.x) * contact;
      projectile.y = from.y + (to.y - from.y) * contact;
      projectile.hitPlayer = true;
      projectile.state = 'resolved';
      return;
    }
    projectile.x = to.x;
    projectile.y = to.y;
    if (edge < 1) {
      projectile.state = 'resolved';
      return;
    }
  }
  if (projectile.x <= exitX + EPSILON) projectile.state = 'resolved';
}

/** Split a frame at protection expiry, so immunity never extends past its clock. */
export function updateSignatureAttack(attack, deltaSeconds, player = null, { projectileImmune = false, immuneSeconds = 0 } = {}) {
  if (!attack || attack.state === 'resolved' || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    return attack;
  }
  // Cap before adding to avoid overflow and ensure the final tick launches even
  // the last delayed shot before resolving, rather than skipping its collision.
  const previousElapsed = attack.elapsedSeconds;
  attack.elapsedSeconds += Math.min(deltaSeconds, Math.max(0, attack.durationSeconds - attack.elapsedSeconds));
  const bounds = projectileImmune ? null : playerBounds(player);
  const immuneUntil = previousElapsed + Math.min(deltaSeconds, Math.max(0, finite(immuneSeconds, 0)));
  for (const projectile of attack.projectiles) {
    if (projectile.state === 'resolved') continue;
    projectile.elapsedSeconds = Math.max(0, attack.elapsedSeconds - projectile.delaySeconds);
    projectile.chargeRemainingSeconds = Math.max(0, CHARGE_SECONDS - projectile.elapsedSeconds);
    if (projectile.chargeRemainingSeconds > EPSILON) continue;
    projectile.chargeRemainingSeconds = 0;
    projectile.state = 'flying';
    const launchAt = projectile.delaySeconds + CHARGE_SECONDS;
    if (immuneUntil > previousElapsed && immuneUntil >= launchAt) {
      moveProjectile(projectile, Math.max(0, Math.min(attack.elapsedSeconds, immuneUntil) - launchAt), null);
    }
    if (projectile.state !== 'resolved' && (immuneUntil < attack.elapsedSeconds || immuneUntil <= previousElapsed)) {
      moveProjectile(projectile, Math.max(0, projectile.elapsedSeconds - CHARGE_SECONDS), bounds);
    }
    attack.hitPlayer ||= projectile.hitPlayer;
  }
  attack.state = attack.projectiles.every((projectile) => projectile.state === 'resolved')
    ? 'resolved'
    : attack.projectiles.some((projectile) => projectile.state === 'flying' || projectile.state === 'resolved')
      ? 'flying' : 'charging';
  return attack;
}

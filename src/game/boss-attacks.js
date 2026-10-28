import {
  BOSS_LASER_ACTIVE_SECONDS,
  BOSS_LASER_FADE_SECONDS,
  BOSS_LASER_SWEEP_SECONDS,
  BOSS_QUARTER_LASER_TELEGRAPH_SECONDS,
  BOSS_LASER_TELEGRAPH_SECONDS,
  BOSS_LASER_THICKNESS,
  BOSS_PROJECTILE_CHARGE_SECONDS,
  BOSS_PROJECTILE_DIRECT_CHANCE,
  BOSS_PROJECTILE_MAX_SPEED_MULTIPLIER,
  BOSS_PROJECTILE_MIN_SPEED_MULTIPLIER,
  BOSS_PROJECTILE_REFLECTION_WINDOW_SECONDS,
  PLAYER_FRONT_HITBOX_TRIM,
  GRAVITY,
  MAX_FRAME_DELTA_SECONDS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants.js';

function roll(rng) {
  return Math.min(0.999999, Math.max(0, Number(rng?.()) || 0));
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function createBossProjectile({
  id,
  bossX,
  bossY,
  playerX,
  playerY,
  baseSpeed,
  rng = Math.random,
  styleKey = 'default',
} = {}) {
  const kind = roll(rng) < BOSS_PROJECTILE_DIRECT_CHANCE ? 'direct' : 'parabolic';
  const speedMultiplier = BOSS_PROJECTILE_MIN_SPEED_MULTIPLIER
    + roll(rng) * (BOSS_PROJECTILE_MAX_SPEED_MULTIPLIER - BOSS_PROJECTILE_MIN_SPEED_MULTIPLIER);
  const curveDirection = roll(rng) < 0.5 ? -1 : 1;
  const curveAmplitude = kind === 'parabolic' ? curveDirection * (56 + roll(rng) * 74) : 0;

  const projectile = {
    id: id ?? 'projectile-1',
    kind,
    x: Number(bossX) || 0,
    y: Number(bossY) || 0,
    bossX: Number(bossX) || 0,
    bossY: Number(bossY) || 0,
    startY: Number(bossY) || 0,
    targetY: Number(playerY) || 0,
    targetX: Number(playerX) || 0,
    speed: Math.max(1, Number(baseSpeed) || 1) * speedMultiplier,
    curveAmplitude,
    chargeRemainingSeconds: BOSS_PROJECTILE_CHARGE_SECONDS,
    reflectionWindowSeconds: BOSS_PROJECTILE_REFLECTION_WINDOW_SECONDS,
    state: 'charging',
    telegraphPoints: [],
    hitPlayer: false,
    returnProgress: 0,
    styleKey,
  };
  projectile.telegraphPoints = Array.from({ length: 9 }, (_, index) =>
    getBossProjectilePoint(projectile, index / 8));
  return projectile;
}

export function getBossProjectilePoint(projectile, progress) {
  const safeProgress = clamp(Number(progress) || 0, 0, 1);
  const distance = Math.max(1, Math.abs(projectile.bossX - projectile.targetX));
  const x = projectile.bossX - distance * safeProgress;
  const linearY = projectile.startY + (projectile.targetY - projectile.startY) * safeProgress;
  const y = linearY + (projectile.kind === 'parabolic'
    ? Math.sin(safeProgress * Math.PI) * projectile.curveAmplitude
    : 0);
  return { x, y };
}

function updateFlyingProjectile(projectile, deltaSeconds) {
  const distance = Math.max(1, Math.abs(projectile.bossX - projectile.targetX));
  const previous = { x: projectile.x, y: projectile.y };
  const nextX = projectile.x - projectile.speed * deltaSeconds;
  const progress = clamp((projectile.bossX - nextX) / distance, 0, 1);
  const point = getBossProjectilePoint(projectile, progress);
  projectile.x = nextX;
  projectile.y = point.y;
  return previous;
}

export function getBossProjectileBodyBounds(projectile) {
  if (!projectile) return null;
  return {
    left: projectile.x - 8,
    right: projectile.x + 8,
    top: projectile.y - 5.5,
    bottom: projectile.y + 5.5,
  };
}

export function intersectsBossProjectilePlayer(projectile, player) {
  if (!projectile || !player) return false;
  const projectileBounds = getBossProjectileBodyBounds(projectile);
  const playerBounds = {
    left: player.x - player.width / 2,
    right: player.x + player.width / 2 - PLAYER_FRONT_HITBOX_TRIM,
    top: player.y - player.height / 2,
    bottom: player.y + player.height / 2,
  };
  return projectileBounds.right >= playerBounds.left
    && projectileBounds.left <= playerBounds.right
    && projectileBounds.bottom >= playerBounds.top
    && projectileBounds.top <= playerBounds.bottom;
}

function sweptBossProjectileIntersectsPlayer(start, projectile, player) {
  const distance = Math.hypot(projectile.x - start.x, projectile.y - start.y);
  const samples = Math.max(1, Math.ceil(distance / 4));
  for (let index = 0; index <= samples; index += 1) {
    const ratio = index / samples;
    const sample = {
      x: start.x + (projectile.x - start.x) * ratio,
      y: start.y + (projectile.y - start.y) * ratio,
    };
    if (intersectsBossProjectilePlayer(sample, player)) return true;
  }
  return false;
}

function updateReturningProjectile(projectile, deltaSeconds) {
  const distance = Math.max(1, projectile.bossX - projectile.targetX);
  projectile.returnProgress = clamp(
    projectile.returnProgress + (projectile.speed * deltaSeconds) / distance,
    0,
    1,
  );
  projectile.x = projectile.targetX + distance * projectile.returnProgress;
  projectile.y = projectile.targetY + (projectile.bossY - projectile.targetY) * projectile.returnProgress;
  if (projectile.returnProgress >= 1) projectile.state = 'resolved';
}

export function updateBossProjectile(projectile, deltaSeconds, player = null) {
  if (!projectile || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) return projectile;

  if (projectile.state === 'charging') {
    projectile.chargeRemainingSeconds = Math.max(0, projectile.chargeRemainingSeconds - deltaSeconds);
    if (projectile.chargeRemainingSeconds === 0) projectile.state = 'flying';
  } else if (projectile.state === 'flying') {
    const previousPosition = updateFlyingProjectile(projectile, deltaSeconds);
    if (player && sweptBossProjectileIntersectsPlayer(previousPosition, projectile, player)) {
      projectile.state = 'missed';
      projectile.hitPlayer = true;
    } else {
      const playerLeft = player
        ? player.x - player.width / 2
        : projectile.targetX - 18;
      if (projectile.x + 8 < playerLeft) {
        projectile.state = 'missed';
        projectile.hitPlayer = false;
      }
    }
  } else if (projectile.state === 'returning') {
    updateReturningProjectile(projectile, deltaSeconds);
  }

  return projectile;
}

export function isProjectileInReflectionWindow(projectile, playerX) {
  if (!projectile || projectile.state !== 'flying' || !Number.isFinite(playerX)) return false;
  return Math.abs(projectile.x - playerX) <= projectile.speed * projectile.reflectionWindowSeconds;
}

export function reflectProjectile(projectile, playerX, playerY) {
  if (!projectile || projectile.state !== 'flying') return false;
  projectile.state = 'returning';
  projectile.targetX = Number(playerX) || projectile.targetX;
  projectile.targetY = Number(playerY) || projectile.targetY;
  projectile.returnProgress = 0;
  projectile.y = projectile.targetY;
  return true;
}

// Protect the entire moving opening, not just its position on the warning frame.
function getProtectedGap(gap, worldHeight, margin) {
  if (![gap.gapCenter, gap.gapHeight].every(Number.isFinite) || gap.gapHeight <= 0) return null;
  const halfGap = gap.gapHeight / 2;
  const center = Number.isFinite(gap.baseGapCenter) ? gap.baseGapCenter : gap.gapCenter;
  const amplitude = gap.movingGap ? Math.max(0, gap.gapMotionAmplitude || 0) : 0;
  const minimum = clamp(center - amplitude, halfGap, worldHeight - halfGap);
  const maximum = clamp(center + amplitude, halfGap, worldHeight - halfGap);
  return { top: minimum - halfGap - margin, bottom: maximum + halfGap + margin };
}

export function isLaserPathSafe(laserY, {
  gapCenter, gapHeight, playerHeight = 24, thickness = BOSS_LASER_THICKNESS,
} = {}) {
  if (![laserY, gapCenter, gapHeight].every(Number.isFinite) || gapHeight <= 0) return false;
  const margin = thickness / 2 + playerHeight / 2;
  return laserY < gapCenter - gapHeight / 2 - margin
    || laserY > gapCenter + gapHeight / 2 + margin;
}

export function findSafeLaserY({
  gaps, gapCenter, gapHeight, worldHeight = WORLD_HEIGHT, rng = Math.random,
  playerHeight = 24, thickness = BOSS_LASER_THICKNESS,
} = {}) {
  const margin = thickness / 2 + playerHeight / 2 + 1; // Keep strict clearance at interval edges.
  const sourceGaps = gaps ?? [{ gapCenter, gapHeight }];
  const protectedGaps = sourceGaps.map((gap) => getProtectedGap(gap, worldHeight, margin));
  if (protectedGaps.some((gap) => !gap)) return null;
  protectedGaps.sort((left, right) => left.top - right.top);
  const intervals = [];
  let start = thickness / 2;
  const end = worldHeight - thickness / 2;
  for (const gap of protectedGaps) {
    if (gap.top > start) intervals.push([start, Math.min(end, gap.top)]);
    start = Math.max(start, gap.bottom);
    if (start >= end) break;
  }
  if (start < end) intervals.push([start, end]);
  const total = intervals.reduce((sum, [low, high]) => sum + Math.max(0, high - low), 0);
  if (total <= 0) return null;
  let sample = roll(rng) * total;
  for (const [low, high] of intervals) {
    if (sample <= high - low) return low + sample;
    sample -= high - low;
  }
  return null;
}

function laserClock(telegraphDurationSeconds) {
  return {
    telegraphDurationSeconds,
    telegraphRemainingSeconds: telegraphDurationSeconds,
    activeRemainingSeconds: BOSS_LASER_ACTIVE_SECONDS,
    activeElapsedSeconds: 0,
    elapsedSeconds: 0,
    fadeRemainingSeconds: BOSS_LASER_FADE_SECONDS,
  };
}

export function createSingleLaser({ rng = Math.random, styleKey = 'default', ...geometry } = {}) {
  const y = findSafeLaserY({ ...geometry, rng });
  if (y === null) return null;
  return {
    kind: 'single', y, safeZone: null,
    ...laserClock(BOSS_LASER_TELEGRAPH_SECONDS),
    thickness: BOSS_LASER_THICKNESS, styleKey,
  };
}

export function createQuarterLaser({
  rng = Math.random, worldHeight = WORLD_HEIGHT, styleKey = 'default', excludeSafeZone = null,
  playerY = worldHeight / 2, playerHeight = 24, liftSpeed = 360, gravity = GRAVITY,
} = {}) {
  const zones = [0, 1, 2, 3].filter((zone) => zone !== excludeSafeZone);
  const safeZone = zones[Math.floor(roll(rng) * zones.length)];
  const zoneHeight = worldHeight / 4;
  const safeCenterMin = safeZone * zoneHeight + playerHeight / 2 + 8;
  const safeCenterMax = (safeZone + 1) * zoneHeight - playerHeight / 2 - 8;
  const distance = playerY < safeCenterMin ? safeCenterMin - playerY
    : playerY > safeCenterMax ? playerY - safeCenterMax : 0;
  // updatePlayer applies gravity before displacement. Budget the slowest supported
  // frame even when the pilot repeatedly lifts, then retain reaction time/margin.
  const climbSpeed = Math.max(1, Math.abs(liftSpeed) - Math.max(0, gravity) * MAX_FRAME_DELTA_SECONDS);
  const preparation = Math.max(BOSS_QUARTER_LASER_TELEGRAPH_SECONDS,
    distance / climbSpeed * 1.2 + .2);
  return {
    kind: 'quarter', y: null,
    safeZone, zoneHeight,
    ...laserClock(preparation),
    thickness: BOSS_LASER_THICKNESS, styleKey,
  };
}

export function getLaserFrontX(laser, worldWidth = WORLD_WIDTH) {
  if (laser.telegraphRemainingSeconds > 0) return worldWidth;
  // Old snapshots without a sweep clock represent an already fully fired beam.
  if (!Number.isFinite(laser.activeElapsedSeconds)) return 0;
  return worldWidth * (1 - clamp(laser.activeElapsedSeconds / BOSS_LASER_SWEEP_SECONDS, 0, 1));
}

export function updateLaser(laser, deltaSeconds) {
  if (!laser || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) return laser;
  laser.elapsedSeconds = (laser.elapsedSeconds ?? 0) + deltaSeconds;
  let remaining = deltaSeconds;
  for (const field of ['telegraphRemainingSeconds', 'activeRemainingSeconds', 'fadeRemainingSeconds']) {
    const consumed = Math.min(remaining, laser[field] ?? 0);
    laser[field] = Math.max(0, (laser[field] ?? 0) - consumed);
    if (laser[field] < 1e-9) laser[field] = 0;
    if (field === 'activeRemainingSeconds') laser.activeElapsedSeconds = (laser.activeElapsedSeconds ?? 0) + consumed;
    remaining = Math.max(0, remaining - consumed);
  }
  return laser;
}

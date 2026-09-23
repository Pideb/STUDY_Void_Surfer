import {
  BOSS_LASER_ACTIVE_SECONDS,
  BOSS_LASER_TELEGRAPH_SECONDS,
  BOSS_LASER_THICKNESS,
  BOSS_PROJECTILE_CHARGE_SECONDS,
  BOSS_PROJECTILE_DIRECT_CHANCE,
  BOSS_PROJECTILE_MAX_SPEED_MULTIPLIER,
  BOSS_PROJECTILE_MIN_SPEED_MULTIPLIER,
  BOSS_PROJECTILE_REFLECTION_WINDOW_SECONDS,
  WORLD_HEIGHT,
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
  const distance = Math.max(1, Math.abs(bossX - playerX));

  return {
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
    curveAmplitude: kind === 'parabolic' ? curveDirection * (56 + roll(rng) * 74) : 0,
    chargeRemainingSeconds: BOSS_PROJECTILE_CHARGE_SECONDS,
    reflectionWindowSeconds: BOSS_PROJECTILE_REFLECTION_WINDOW_SECONDS,
    state: 'charging',
    telegraphPoints: kind === 'parabolic'
      ? Array.from({ length: 7 }, (_, index) => {
        const progress = index / 6;
        return {
          x: bossX - distance * progress,
          y: (bossY + (playerY - bossY) * progress)
            + Math.sin(progress * Math.PI) * (curveDirection * 65),
        };
      })
      : [],
    hitPlayer: false,
    returnProgress: 0,
    styleKey,
  };
}

function updateFlyingProjectile(projectile, deltaSeconds) {
  const distance = Math.max(1, projectile.bossX - projectile.targetX);
  projectile.x -= projectile.speed * deltaSeconds;
  const progress = clamp((projectile.bossX - projectile.x) / distance, 0, 1);
  projectile.y = projectile.startY
    + (projectile.targetY - projectile.startY) * progress
    + (projectile.kind === 'parabolic' ? Math.sin(progress * Math.PI) * projectile.curveAmplitude : 0);
  if (projectile.x <= projectile.targetX - projectile.speed * deltaSeconds) {
    projectile.state = 'missed';
    projectile.hitPlayer = true;
  }
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

export function updateBossProjectile(projectile, deltaSeconds) {
  if (!projectile || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) return projectile;

  if (projectile.state === 'charging') {
    projectile.chargeRemainingSeconds = Math.max(0, projectile.chargeRemainingSeconds - deltaSeconds);
    if (projectile.chargeRemainingSeconds === 0) projectile.state = 'flying';
  } else if (projectile.state === 'flying') {
    updateFlyingProjectile(projectile, deltaSeconds);
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

export function isLaserPathSafe(laserY, { gapCenter, gapHeight, playerHeight = 24, thickness = BOSS_LASER_THICKNESS } = {}) {
  if (![laserY, gapCenter, gapHeight].every(Number.isFinite)) return false;
  const gapTop = gapCenter - gapHeight / 2;
  const gapBottom = gapCenter + gapHeight / 2;
  const occupiedTop = laserY - thickness / 2 - playerHeight / 2;
  const occupiedBottom = laserY + thickness / 2 + playerHeight / 2;
  return occupiedTop > gapTop || occupiedBottom < gapBottom;
}

export function findSafeLaserY({
  gapCenter,
  gapHeight,
  worldHeight = WORLD_HEIGHT,
  rng = Math.random,
  playerHeight = 24,
  thickness = BOSS_LASER_THICKNESS,
} = {}) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const y = thickness / 2 + roll(rng) * (worldHeight - thickness);
    if (isLaserPathSafe(y, { gapCenter, gapHeight, playerHeight, thickness })) return y;
  }
  return clamp(gapCenter, thickness / 2, worldHeight - thickness / 2);
}

export function createSingleLaser({ gapCenter, gapHeight, rng = Math.random, styleKey = 'default' } = {}) {
  return {
    kind: 'single',
    y: findSafeLaserY({ gapCenter, gapHeight, rng }),
    safeZone: null,
    telegraphRemainingSeconds: BOSS_LASER_TELEGRAPH_SECONDS,
    activeRemainingSeconds: BOSS_LASER_ACTIVE_SECONDS,
    thickness: BOSS_LASER_THICKNESS,
    styleKey,
  };
}

export function createQuarterLaser({ rng = Math.random, worldHeight = WORLD_HEIGHT, styleKey = 'default' } = {}) {
  return {
    kind: 'quarter',
    y: null,
    safeZone: Math.floor(roll(rng) * 4),
    zoneHeight: worldHeight / 4,
    telegraphRemainingSeconds: BOSS_LASER_TELEGRAPH_SECONDS,
    activeRemainingSeconds: BOSS_LASER_ACTIVE_SECONDS,
    thickness: BOSS_LASER_THICKNESS,
    styleKey,
  };
}

export function updateLaser(laser, deltaSeconds) {
  if (!laser || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) return laser;
  if (laser.telegraphRemainingSeconds > 0) {
    laser.telegraphRemainingSeconds = Math.max(0, laser.telegraphRemainingSeconds - deltaSeconds);
  } else {
    laser.activeRemainingSeconds = Math.max(0, laser.activeRemainingSeconds - deltaSeconds);
  }
  return laser;
}

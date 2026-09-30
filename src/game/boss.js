import {
  BOSS_CHALLENGE_SECOND_PROBABILITY,
  BOSS_EARLY_HP,
  BOSS_LATE_HP,
  BOSS_LATE_HP_START,
  BOSS_CHALLENGE_START_NUMBER,
} from './constants.js';

function roll(rng) {
  return Math.min(0.999999, Math.max(0, Number(rng?.()) || 0));
}

export function getBossHealth(number) {
  return Number(number) >= BOSS_LATE_HP_START ? BOSS_LATE_HP : BOSS_EARLY_HP;
}

export function createBossEncounter(number, rng = Math.random) {
  const safeNumber = Math.max(1, Math.trunc(Number(number) || 1));
  const maxHp = getBossHealth(safeNumber);
  const targetChallengeCount = safeNumber < BOSS_CHALLENGE_START_NUMBER
    ? 0
    : safeNumber >= 7 && roll(rng) < BOSS_CHALLENGE_SECOND_PROBABILITY ? 2 : 1;

  return {
    number: safeNumber,
    hp: maxHp,
    maxHp,
    reflectedCount: 0,
    requiredReflections: maxHp,
    attack: null,
    reflectedProjectile: null,
    normalWallsSinceProjectile: 0,
    lastSpecialResolvedAt: null,
    lastProjectileResolvedAt: null,
    challengeCount: 0,
    targetChallengeCount,
    nextChallengeReflection: targetChallengeCount > 0 ? 1 + Math.floor(roll(rng) * 2) : null,
    wallSpawningPaused: false,
    cleared: false,
  };
}

export function advanceBossEncounter(encounter, event, value = 0) {
  if (!encounter || encounter.cleared) return encounter;

  if (event === 'projectile-reflected') {
    encounter.reflectedCount += 1;
    encounter.hp = Math.max(0, encounter.maxHp - encounter.reflectedCount);
  } else if (event === 'special-resolved') {
    encounter.lastSpecialResolvedAt = Number(value) || 0;
  } else if (event === 'projectile-resolved') {
    encounter.lastProjectileResolvedAt = Number(value) || 0;
    encounter.normalWallsSinceProjectile = 0;
  } else if (event === 'normal-wall-passed') {
    encounter.normalWallsSinceProjectile += 1;
  } else if (event === 'challenge-complete') {
    encounter.challengeCount += 1;
    encounter.nextChallengeReflection = encounter.challengeCount < encounter.targetChallengeCount
      ? encounter.reflectedCount + 2
      : null;
  } else if (event === 'boss-cleared') {
    encounter.cleared = true;
    encounter.wallSpawningPaused = false;
  }

  return encounter;
}

export function resolveMissedBossProjectile(encounter, elapsedSeconds) {
  const attack = encounter?.attack;
  if (!attack || attack.type !== 'projectile' || attack.state !== 'missed' || attack.hitPlayer) {
    return false;
  }
  advanceBossEncounter(encounter, 'projectile-resolved', elapsedSeconds);
  encounter.attack = null;
  encounter.awaitingNextWave = true;
  return true;
}

export function shouldStartBossChallenge(encounter) {
  return Boolean(
    encounter
    && encounter.targetChallengeCount > encounter.challengeCount
    && encounter.nextChallengeReflection !== null
    && encounter.reflectedCount >= encounter.nextChallengeReflection,
  );
}

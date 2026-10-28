import { BOSS_ENTRANCE_SECONDS, BOSS_REQUIRED_CHALLENGES } from './constants.js';

export function getBossHealth() {
  return BOSS_REQUIRED_CHALLENGES;
}

export function createBossEncounter(number, stageId = 'crystal-gates') {
  const safeNumber = Math.max(1, Math.trunc(Number(number) || 1));
  const maxHp = getBossHealth();

  return {
    number: safeNumber,
    stageId,
    cyclePhase: 'walls',
    cycleNumber: 1,
    singleLaserElapsedSeconds: 0,
    volleyBudget: 1,
    volleysFired: 0,
    volleyElapsedSeconds: 0,
    globalShotsRemaining: 0,
    previousSafeZone: null,
    roar: null,
    counterattack: null,
    animation: { kind: 'idle', elapsedSeconds: 0, durationSeconds: 0, actionId: null },
    hp: maxHp,
    maxHp,
    entranceDurationSeconds: BOSS_ENTRANCE_SECONDS,
    entranceRemainingSeconds: BOSS_ENTRANCE_SECONDS,
    successfulChallenges: 0,
    requiredChallenges: maxHp,
    attack: null,
    normalWallsSinceAttack: 0,
    lastSpecialResolvedAt: null,
    lastAttackResolvedAt: null,
    challengeCount: 0,
    lastAttackWasLaser: false,
    wallSpawningPaused: false,
    awaitingNextWave: false,
    cleared: false,
  };
}

export function advanceBossEncounter(encounter, event, value = 0) {
  if (!encounter || encounter.cleared) return encounter;

  if (event === 'challenge-success' || event === 'challenge-failure') {
    encounter.challengeCount += 1;
    if (event === 'challenge-success') {
      encounter.successfulChallenges = Math.min(encounter.requiredChallenges, encounter.successfulChallenges + 1);
      encounter.hp = encounter.maxHp - encounter.successfulChallenges;
    }
  } else if (event === 'special-resolved') {
    encounter.lastSpecialResolvedAt = Number(value) || 0;
  } else if (event === 'attack-resolved') {
    encounter.lastAttackResolvedAt = Number(value) || 0;
    encounter.normalWallsSinceAttack = 0;
  } else if (event === 'normal-wall-passed') {
    encounter.normalWallsSinceAttack += 1;
  } else if (event === 'boss-cleared') {
    encounter.cleared = true;
    encounter.wallSpawningPaused = false;
  }

  return encounter;
}

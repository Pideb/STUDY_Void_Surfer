import { describe, expect, it } from 'vitest';
import {
  advanceBossEncounter,
  createBossEncounter,
  getBossHealth,
} from '../../src/game/boss.js';

describe('boss encounter', () => {
  it('counts an AEGIS impact as one hit with three damage, preserving maxHP3', () => {
    const encounter = createBossEncounter(1);
    advanceBossEncounter(encounter, 'laser-hit', NaN); expect(encounter.hp).toBe(3);
    advanceBossEncounter(encounter, 'laser-hit', 3);
    expect(encounter).toMatchObject({ hp: 0, maxHp: 3, laserHits: 1, damageTaken: 3 });
    advanceBossEncounter(encounter, 'laser-hit', 3); expect(encounter.laserHits).toBe(1);
  });
  it('requires three laser hits for both early and late bosses', () => {
    expect(getBossHealth(1)).toBe(3);
    expect(getBossHealth(4)).toBe(3);
    expect(getBossHealth(5)).toBe(3);
    expect(createBossEncounter(20)).toMatchObject({ hp: 3, requiredChallenges: 3, successfulChallenges: 0 });
  });

  it('damages the boss only on laser hits and counts failed attempts', () => {
    const encounter = createBossEncounter(1);

    advanceBossEncounter(encounter, 'challenge-failure');
    expect(encounter).toMatchObject({ hp: 3, challengeCount: 1, successfulChallenges: 0 });
    advanceBossEncounter(encounter, 'challenge-success');
    expect(encounter).toMatchObject({ hp: 3, challengeCount: 2, successfulChallenges: 1 });
    advanceBossEncounter(encounter, 'challenge-success');
    advanceBossEncounter(encounter, 'challenge-success');
    expect(encounter).toMatchObject({ hp: 3, successfulChallenges: 3 });
    for(let i=0;i<3;i++) advanceBossEncounter(encounter,'laser-hit');
    expect(encounter).toMatchObject({ hp: 0, laserHits: 3 });
    advanceBossEncounter(encounter, 'boss-cleared');
    advanceBossEncounter(encounter, 'challenge-failure');
    expect(encounter).toMatchObject({ cleared: true, challengeCount: 4 });
  });

  it('tracks wall and attack cooldowns independently of score or reflections', () => {
    const encounter = createBossEncounter(2);
    advanceBossEncounter(encounter, 'normal-wall-passed');
    advanceBossEncounter(encounter, 'normal-wall-passed');
    expect(encounter.normalWallsSinceAttack).toBe(2);
    advanceBossEncounter(encounter, 'special-resolved', 7);
    advanceBossEncounter(encounter, 'attack-resolved', 8);
    expect(encounter).toMatchObject({ normalWallsSinceAttack: 0, lastSpecialResolvedAt: 7, lastAttackResolvedAt: 8 });
    advanceBossEncounter(encounter, 'projectile-reflected');
    expect(encounter.hp).toBe(3);
    expect(encounter).not.toHaveProperty('nextChallengeReflection');
    expect(encounter).not.toHaveProperty('reflectedCount');
  });
});

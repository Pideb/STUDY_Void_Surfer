import { describe, expect, it } from 'vitest';
import {
  advanceBossEncounter,
  createBossEncounter,
  getBossHealth,
  shouldStartBossChallenge,
} from '../../src/game/boss.js';

describe('boss encounter', () => {
  it('uses three HP through boss four and five HP from boss five', () => {
    expect(getBossHealth(1)).toBe(3);
    expect(getBossHealth(4)).toBe(3);
    expect(getBossHealth(5)).toBe(5);
  });

  it('tracks reflected damage, normal-wall cooldown, and challenge thresholds', () => {
    const encounter = createBossEncounter(3, () => 0);

    expect(encounter).toMatchObject({ hp: 3, maxHp: 3, targetChallengeCount: 1, nextChallengeReflection: 1 });
    advanceBossEncounter(encounter, 'normal-wall-passed');
    advanceBossEncounter(encounter, 'normal-wall-passed');
    expect(encounter.normalWallsSinceProjectile).toBe(2);
    advanceBossEncounter(encounter, 'projectile-reflected');
    expect(encounter.hp).toBe(2);
    expect(shouldStartBossChallenge(encounter)).toBe(true);
    advanceBossEncounter(encounter, 'challenge-complete');
    expect(encounter.challengeCount).toBe(1);
    expect(shouldStartBossChallenge(encounter)).toBe(false);
  });

  it('supports a 70 percent second challenge chance from boss seven onward', () => {
    expect(createBossEncounter(7, () => 0.1).targetChallengeCount).toBe(2);
    expect(createBossEncounter(7, () => 0.9).targetChallengeCount).toBe(1);
  });
});

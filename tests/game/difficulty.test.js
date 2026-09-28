import { describe, expect, it } from 'vitest';
import { BOSS_PATTERNS } from '../../src/game/constants.js';
import {
  getBaseSpeed,
  getDifficulty,
  getBossSpeedMultiplier,
  shouldSpawnSpecial,
  shouldSpawnMovingGap,
} from '../../src/game/difficulty.js';

describe('difficulty', () => {
  it('increases base speed by ten percent every ten progression points', () => {
    expect(getBaseSpeed(0)).toBe(240);
    expect(getBaseSpeed(9)).toBe(240);
    expect(getBaseSpeed(10)).toBeCloseTo(264);
    expect(getBaseSpeed(20)).toBeCloseTo(290.4);
    expect(getDifficulty(0, 120, 0, Math.random, null, 20, 10).baseSpeed).toBeCloseTo(264);
  });

  it('keeps special walls locked below score ten', () => {
    const difficulty = getDifficulty(9, 0, 0);

    expect(difficulty.specialChance).toBe(0);
    expect(shouldSpawnSpecial(() => 0, difficulty)).toBe(false);
  });

  it('unlocks special walls at score ten and uses the widened normal timing window', () => {
    const difficulty = getDifficulty(10, 0, 0);

    expect(difficulty.specialChance).toBe(0.2);
    expect(difficulty.timingWindowSeconds).toBe(0.30);
    expect(shouldSpawnSpecial(() => 0.19, difficulty)).toBe(true);
    expect(shouldSpawnSpecial(() => 0.2, difficulty)).toBe(false);
  });

  it('starts warning at twenty points and every ten points after completion', () => {
    expect(getDifficulty(19, 0, 0).isWarning).toBe(false);
    expect(getDifficulty(20, 0, 0)).toMatchObject({
      isWarning: true,
      warningIndex: 1,
      specialChance: 0.5,
      gapHeight: 135,
      timingWindowSeconds: 0.15,
    });
    expect(getDifficulty(20, 0, 1, Math.random, null, 30).isWarning).toBe(false);
    expect(getDifficulty(30, 0, 1).warningIndex).toBe(2);
  });

  it('marks every fifth active warning as a boss', () => {
    const difficulty = getDifficulty(60, 0, 4, () => 0.5);

    expect(difficulty.isBoss).toBe(true);
    expect(difficulty.warningIndex).toBe(5);
    expect(Object.values(BOSS_PATTERNS)).toContain(difficulty.bossPattern);
    expect(getBossSpeedMultiplier(BOSS_PATTERNS.SLOW)).toBe(0.5);
    expect(getBossSpeedMultiplier(BOSS_PATTERNS.FAST)).toBe(1.8);
  });

  it('unlocks moving normal-wall gaps at score fifty', () => {
    expect(getDifficulty(49, 0, 4).movingGapChance).toBe(0);
    const difficulty = getDifficulty(50, 0, 4);

    expect(difficulty.movingGapChance).toBe(0.5);
    expect(shouldSpawnMovingGap(() => 0.49, difficulty)).toBe(true);
    expect(shouldSpawnMovingGap(() => 0.5, difficulty)).toBe(false);
  });

  it('keeps an explicitly selected boss pattern instead of rolling again', () => {
    const difficulty = getDifficulty(60, 10, 4, () => 0, BOSS_PATTERNS.FAST);

    expect(difficulty.bossPattern).toBe(BOSS_PATTERNS.FAST);
    expect(difficulty.speedMultiplier).toBe(1.8);
  });
});

import { describe, expect, it } from 'vitest';
import { BOSS_PATTERNS } from '../../src/game/constants.js';
import {
  getBaseSpeed,
  getDifficulty,
  getBossSpeedMultiplier,
  chooseWarningScoreStep,
  shouldSpawnSpecial,
  shouldSpawnMovingGap,
} from '../../src/game/difficulty.js';

describe('difficulty', () => {
  it('caps base progression at220 and preserves boss multipliers', () => {
    const ceiling = 460;
    expect(getBaseSpeed(99)).toBe(330);
    for (const score of [220, 229, 250, 10000]) expect(getBaseSpeed(score)).toBeCloseTo(ceiling);
    expect(getBaseSpeed(NaN)).toBe(240);
    expect(getBaseSpeed(-1)).toBe(240);
    expect(getDifficulty(220, 0, 1, () => 0, BOSS_PATTERNS.FAST).scrollSpeed).toBeCloseTo(ceiling * 1.25);
    expect(getDifficulty(220, 0, 1, () => 0, BOSS_PATTERNS.SLOW).scrollSpeed).toBeCloseTo(ceiling * .75);
  });
  it.each([['default',220,1,460],['aegis',220,1,460],['velocity',220,2,700]])('%s stops score-driven growth at%s', (id,cap,multiplier,ceiling) => {
    expect(getBaseSpeed(cap-1,id)*multiplier).toBe(ceiling-10);
    for(const score of [cap,cap+9,250,10000])expect(getBaseSpeed(score,id)*multiplier).toBe(ceiling);
    expect(getDifficulty(cap,0,1,()=>0,BOSS_PATTERNS.FAST,20,cap,false,id).baseSpeed).toBeCloseTo(getBaseSpeed(cap,id));
  });

  it('chooses an inclusive five-to-eight-point encounter interval', () => {
    expect(chooseWarningScoreStep(() => 0)).toBe(5);
    expect(chooseWarningScoreStep(() => .5)).toBe(7);
    expect(chooseWarningScoreStep(() => 1)).toBe(8);
  });
  it('increases speed by a fixed ten every ten progression points', () => {
    expect(getBaseSpeed(0)).toBe(240);
    expect(getBaseSpeed(9)).toBe(240);
    expect(getBaseSpeed(10)).toBe(250);
    expect(getBaseSpeed(20)).toBe(260);
    expect(getDifficulty(0, 120, 0, Math.random, null, 20, 10).baseSpeed).toBe(250);
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

  it('alternates regular WARNING first and BOSS second', () => {
    const first = getDifficulty(20, 0, 0, () => 0.5);
    const difficulty = getDifficulty(30, 0, 1, () => 0.5);

    expect(first).toMatchObject({ isWarning: true, isBoss: false, warningIndex: 1 });
    expect(difficulty.isBoss).toBe(true);
    expect(difficulty.warningIndex).toBe(2);
    expect(Object.values(BOSS_PATTERNS)).toContain(difficulty.bossPattern);
    expect(getBossSpeedMultiplier(BOSS_PATTERNS.SLOW)).toBe(0.75);
    expect(getBossSpeedMultiplier(BOSS_PATTERNS.FAST)).toBe(1.25);
    expect(getBossSpeedMultiplier(BOSS_PATTERNS.SHIFT, 0)).toBe(0.75);
    expect(getBossSpeedMultiplier(BOSS_PATTERNS.SHIFT, 1.99)).toBe(0.75);
    expect(getBossSpeedMultiplier(BOSS_PATTERNS.SHIFT, 2)).toBe(1.25);
    expect(getBossSpeedMultiplier(BOSS_PATTERNS.SHIFT, 4)).toBe(0.75);
  });

  it('unlocks moving gaps after the first boss clear instead of at score fifty', () => {
    expect(getDifficulty(100, 0, 0).movingGapChance).toBe(0);
    const difficulty = getDifficulty(40, 0, 2, Math.random, null, 50, 40, true);

    expect(difficulty.movingGapChance).toBe(0.5);
    expect(shouldSpawnMovingGap(() => 0.49, difficulty)).toBe(true);
    expect(shouldSpawnMovingGap(() => 0.5, difficulty)).toBe(false);
  });

  it('keeps an explicitly selected boss pattern instead of rolling again', () => {
    const difficulty = getDifficulty(30, 10, 1, () => 0, BOSS_PATTERNS.FAST);

    expect(difficulty.bossPattern).toBe(BOSS_PATTERNS.FAST);
    expect(difficulty.speedMultiplier).toBe(1.25);
  });
});

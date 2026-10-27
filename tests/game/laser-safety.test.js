import { describe, expect, it } from 'vitest';
import {
  createQuarterLaser,
  createSingleLaser,
  findSafeLaserY,
  getLaserFrontX,
  isLaserPathSafe,
  updateLaser,
} from '../../src/game/boss-attacks.js';

describe('boss laser safety', () => {
  it('finds a laser Y that leaves a route through the active gap', () => {
    const y = findSafeLaserY({ gapCenter: 270, gapHeight: 180, rng: () => 0.5 });

    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(540);
    expect(isLaserPathSafe(y, { gapCenter: 270, gapHeight: 180 })).toBe(true);
    expect(createSingleLaser({ gapCenter: 270, gapHeight: 180, rng: () => 0.5 }).kind).toBe('single');
  });

  it('rejects beams anywhere inside a gap, and never falls back to its center', () => {
    for (const y of [180, 210, 270, 330, 360]) {
      expect(isLaserPathSafe(y, { gapCenter: 270, gapHeight: 180 })).toBe(false);
    }
    expect(isLaserPathSafe(100, { gapCenter: 270, gapHeight: 180 })).toBe(true);
    expect(isLaserPathSafe(420, { gapCenter: 270, gapHeight: 180 })).toBe(true);
    expect(findSafeLaserY({ gapCenter: 270, gapHeight: 540 })).toBeNull();
    expect(createSingleLaser({ gapCenter: 270, gapHeight: 540 })).toBeNull();
    expect(findSafeLaserY({ gapCenter: NaN, gapHeight: 100 })).toBeNull();
  });

  it('protects every opening including its full oscillation envelope', () => {
    const gaps = [
      { gapCenter: 120, baseGapCenter: 120, gapHeight: 100, movingGap: true, gapMotionAmplitude: 60 },
      { gapCenter: 400, gapHeight: 100 },
    ];
    for (let index = 0; index < 100; index += 1) {
      const y = findSafeLaserY({ gaps, rng: () => index / 100 });
      expect(y).not.toBeNull();
      for (let phase = -1; phase <= 1; phase += 0.1) {
        expect(isLaserPathSafe(y, { gapCenter: 120 + 60 * phase, gapHeight: 100 })).toBe(true);
      }
      expect(isLaserPathSafe(y, gaps[1])).toBe(true);
    }
    expect(findSafeLaserY({ gaps: [
      { gapCenter: 135, gapHeight: 270 }, { gapCenter: 405, gapHeight: 270 },
    ] })).toBeNull();
  });

  it('uses independent warnings and carries leftover frame time into the sweep and fade', () => {
    const laser = createSingleLaser({ gapCenter: 270, gapHeight: 180 });
    expect(laser.telegraphRemainingSeconds).toBe(0.7);
    expect(getLaserFrontX(laser)).toBe(960);
    updateLaser(laser, 0.8);
    expect(laser.activeElapsedSeconds).toBeCloseTo(0.1);
    expect(laser.activeRemainingSeconds).toBeCloseTo(0.9);
    expect(getLaserFrontX(laser)).toBeCloseTo(720);
    updateLaser(laser, 0.3);
    expect(getLaserFrontX(laser)).toBeCloseTo(0);
    updateLaser(laser, 0.7);
    expect(laser.activeRemainingSeconds).toBe(0);
    expect(laser.fadeRemainingSeconds).toBeCloseTo(0.05);
    updateLaser(laser, 10);
    expect(laser.fadeRemainingSeconds).toBe(0);
  });

  it('telegraphs a random safe quarter zone before activating it', () => {
    const laser = createQuarterLaser({ rng: () => 0.99 });

    expect(laser).toMatchObject({ kind: 'quarter', safeZone: 3, telegraphRemainingSeconds: 2 });
    updateLaser(laser, 2);
    expect(laser.activeRemainingSeconds).toBe(1);
    updateLaser(laser, 1);
    expect(laser.activeRemainingSeconds).toBe(0);
  });
});

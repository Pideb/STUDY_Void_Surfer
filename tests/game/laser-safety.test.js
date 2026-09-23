import { describe, expect, it } from 'vitest';
import {
  createQuarterLaser,
  createSingleLaser,
  findSafeLaserY,
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

  it('telegraphs a random safe quarter zone before activating it', () => {
    const laser = createQuarterLaser({ rng: () => 0.99 });

    expect(laser).toMatchObject({ kind: 'quarter', safeZone: 3, telegraphRemainingSeconds: 0.7 });
    updateLaser(laser, 0.7);
    expect(laser.activeRemainingSeconds).toBe(1);
    updateLaser(laser, 1);
    expect(laser.activeRemainingSeconds).toBe(0);
  });
});

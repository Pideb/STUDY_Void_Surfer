import { describe, expect, it } from 'vitest';
import {
  AIRCRAFT_CATALOG,
  getAircraftDefinition,
  getUnlockedAircraftIds,
  isAircraftUnlocked,
} from '../../src/game/aircraft.js';

describe('aircraft catalog', () => {
  it('defines the three balanced profiles with the approved thresholds', () => {
    expect(AIRCRAFT_CATALOG.map(({ id }) => id)).toEqual(['default', 'aegis', 'velocity']);
    expect(getAircraftDefinition('velocity')).toMatchObject({
      unlockBestScore: 100,
      scoreMultiplier: 1.5,
      scrollSpeedMultiplier: 2,
      spawnIntervalMultiplier: 0.5,
      gravityMultiplier: 1,
      liftMultiplier: 1,
    });
    expect(getAircraftDefinition('aegis')).toMatchObject({
      unlockBestScore: 50,
      scoreMultiplier: 1,
      scrollSpeedMultiplier: 1,
      spawnIntervalMultiplier: 1,
      gravityMultiplier: 1.5,
      liftMultiplier: 0.6,
    });
  });

  it('unlocks default, then aegis, then velocity by account best score', () => {
    expect(getUnlockedAircraftIds(-10)).toEqual(['default']);
    expect(getUnlockedAircraftIds(50)).toEqual(['default', 'aegis']);
    expect(getUnlockedAircraftIds(100)).toEqual(['default', 'aegis', 'velocity']);
  });

  it('keeps the default aircraft id while displaying its NOVA name', () => {
    expect(getAircraftDefinition('default')).toMatchObject({ id: 'default', name: 'NOVA' });
  });

  it('normalizes unknown definitions but does not treat unknown ids as unlocked', () => {
    expect(getAircraftDefinition('unknown').id).toBe('default');
    expect(isAircraftUnlocked('unknown', 999)).toBe(false);
    expect(Object.isFrozen(getAircraftDefinition('default'))).toBe(true);
  });
});

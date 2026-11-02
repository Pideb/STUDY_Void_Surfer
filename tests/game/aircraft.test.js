import { describe, expect, it } from 'vitest';
import {
  canSelectAircraft,
  AIRCRAFT_CATALOG,
  getAircraftDefinition,
  getUnlockedAircraftIds,
  isAircraftUnlocked,
} from '../../src/game/aircraft.js';

describe('aircraft catalog', () => {
  it('keeps guest availability independent of account thresholds',()=>{
    for(const bestScore of [0,50,100,10000]){
      expect(AIRCRAFT_CATALOG.filter(craft=>canSelectAircraft(craft.id,{guestMode:true,bestScore})).map(craft=>craft.id)).toEqual(['default','aegis','velocity']);
    }
    expect(canSelectAircraft('unknown',{guestMode:true})).toBe(false);
    expect(canSelectAircraft('aegis',{bestScore:50})).toBe(true);
  });
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
      gravityMultiplier: 1.3,
      liftMultiplier: 0.7,
    });
  });

  it('unlocks default, then aegis, then velocity by account best score', () => {
    expect(getUnlockedAircraftIds(-10,{temporaryUnlock:false})).toEqual(['default']);
    expect(getUnlockedAircraftIds(50,{temporaryUnlock:false})).toEqual(['default', 'aegis']);
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

it("restores original access at base0.3 without numeric parsing",async()=>{const {getAircraftAccess}=await import("../../src/game/feedback-policy.js");expect(getAircraftAccess({guestMode:true,versionBase:"0.2"}).allowedIds).toHaveLength(3);expect(getAircraftAccess({guestMode:true,versionBase:"0.3"}).allowedIds).toEqual(["default"]);expect(getAircraftAccess({bestScore:50,versionBase:"0.3"}).allowedIds).toEqual(["default","aegis"]);});
import {describe,it,expect} from 'vitest';
import {getBarrierSpeedBound} from '../../src/game/barrier-spacing.js';
import {getBaseSpeed} from '../../src/game/difficulty.js';

describe('future barrier speed bound',()=>{
  it.each([['default',1,550],['aegis',1,550],['velocity',2,850]])('uses the same %s cap as actual flight', (aircraftId,aircraftSpeedMultiplier,ceiling)=>{
    expect(getBarrierSpeedBound({progressionScore:10000,aircraftId,aircraftSpeedMultiplier})).toBeCloseTo(getBaseSpeed(10000,aircraftId)*1.25*aircraftSpeedMultiplier);
    expect(getBarrierSpeedBound({progressionScore:10000,aircraftId,aircraftSpeedMultiplier})).toBe(ceiling);
  });
  it('includes future score steps and fast-boss changes without applying the endgame cap from launch',()=>{
    const speed=getBarrierSpeedBound({progressionScore:10,unpassedCount:2,minimumScrollSpeed:198,minimumSpawnInterval:1.4});
    expect(speed).toBeGreaterThan(getBaseSpeed(10)*1.25);
    expect(speed).toBeLessThan(getBaseSpeed(150));
  });
  it.each([1,2])('caps future growth but includes aircraft and boss factors (%s)',aircraftSpeedMultiplier=>{
    expect(getBarrierSpeedBound({progressionScore:200,aircraftSpeedMultiplier})).toBeCloseTo(getBaseSpeed(200)*1.25*aircraftSpeedMultiplier);
  });
  it('keeps malformed inputs finite',()=>{
    expect(Number.isFinite(getBarrierSpeedBound({progressionScore:NaN,minimumScrollSpeed:0,minimumSpawnInterval:Infinity,aircraftSpeedMultiplier:NaN}))).toBe(true);
  });
});

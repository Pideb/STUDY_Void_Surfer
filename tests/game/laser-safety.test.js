import { describe, expect, it } from 'vitest';
import {
  createQuarterLaser,
  createSingleLaser,
  findSafeLaserY,
  getLaserFrontX,
  isLaserPathSafe,
  updateLaser,
  canFireLineLaser,
} from '../../src/game/boss-attacks.js';
import {intersectsPlayerLaser} from '../../src/game/collision.js';

describe('boss laser safety', () => {
  it('uses random heights away from top/bottom15% with25% clear space, independent of openings', () => {
    for (let i = 0; i < 101; i++) {
      const attack = createSingleLaser({ gapCenter: 270, gapHeight: 180, rng: () => i / 100, lineCount: 2 });
      expect(attack).not.toBeNull();
      for (const y of attack.ys) {
        expect(y - attack.thickness / 2).toBeGreaterThanOrEqual(81);
        expect(y + attack.thickness / 2).toBeLessThanOrEqual(459);
      }
      if(attack.ys.length===2)expect(Math.abs(attack.ys[0]-attack.ys[1])-attack.thickness).toBeGreaterThanOrEqual(135-1e-9);
    }
    expect(createSingleLaser({ gapCenter: 270, gapHeight: 540,rng:()=>.5 }).y).toBe(270);
    expect(createSingleLaser({ worldHeight:30,lineCount:2,rng:()=>.5 }).ys).toHaveLength(1);
  });
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
    expect(createSingleLaser({ gapCenter: 270, gapHeight: 540 })).not.toBeNull();
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
    expect(laser.activeRemainingSeconds).toBeCloseTo(0.1);
    expect(getLaserFrontX(laser)).toBeCloseTo(0);
    updateLaser(laser, 0.15);
    expect(laser.activeRemainingSeconds).toBe(0);
    expect(laser.fadeRemainingSeconds).toBeCloseTo(0.05);
    updateLaser(laser, 10);
    expect(laser.fadeRemainingSeconds).toBe(0);
  });

  it.each([240,460,700,770,875])('requires full horizontal clearance for the entire emission at speed%s',speed=>{
    const player={x:240,y:270};
    for(const kind of ['normal','special','hybrid']){
      expect(canFireLineLaser({player,scrollSpeed:speed,obstacles:[{kind,x:220,width:72}]})).toBe(false);
      expect(canFireLineLaser({player,scrollSpeed:speed,obstacles:[{kind,x:248+speed*.19,width:72}]})).toBe(false);
      expect(canFireLineLaser({player,scrollSpeed:speed,obstacles:[{kind,x:248+speed*.25,width:72}]})).toBe(true);
      expect(canFireLineLaser({player,scrollSpeed:speed,obstacles:[{kind,x:232-speed*.05-72,width:72}]})).toBe(true);
    }
    expect((1032-248)/speed).toBeGreaterThan(.24);
  });
  it('holds a fixed warning harmlessly until a valid wall gap, including fade-crossing damage',()=>{
    const laser=createSingleLaser({rng:()=>.5});const player={x:240,y:270};
    updateLaser(laser,.8,{canActivate:()=>false});
    expect(laser.waitingForGap).toBe(true);expect(laser.y).toBe(270);
    expect(laser.activeRemainingSeconds).toBe(.2);
    expect(getLaserFrontX(laser)).toBe(960);expect(intersectsPlayerLaser(player,laser)).toBe(false);
    updateLaser(laser,.1,{canActivate:()=>true});expect(intersectsPlayerLaser(player,laser)).toBe(true);
    updateLaser(laser,.15);expect(laser.activeRemainingSeconds).toBe(0);
    expect(intersectsPlayerLaser(player,laser)).toBe(true);
    updateLaser(laser,.01);expect(intersectsPlayerLaser(player,laser)).toBe(false);
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

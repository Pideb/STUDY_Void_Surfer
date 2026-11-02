import {describe,it,expect} from 'vitest';
import {STAGE_CATALOG} from '../../src/game/stages.js';
import {AIRCRAFT_CATALOG} from '../../src/game/aircraft.js';
import {getBaseSpeed,chooseBossPattern,getBossWallRules} from '../../src/game/difficulty.js';
import {findFiniteAttackPath} from '../helpers/finite-attack-path.js';
import {createGameEngine} from '../../src/game/game-engine.js';

const matrix=STAGE_CATALOG.flatMap(s=>AIRCRAFT_CATALOG.flatMap(c=>[2,3,4,7].flatMap(b=>[1/60,1/30,.1].flatMap(dt=>[0,220].map(score=>({stageId:s.id,craft:c,bossNumber:b,dt,scrollSpeed:getBaseSpeed(score,c.id)*c.scrollSpeedMultiplier*(score===220?(c.id==='velocity'?1.1:1.25):1)}))))));
describe('integrated v0.2 boundaries',()=>{
 it.each(matrix)('$stageId / $craft.id / boss$bossNumber / dt$dt admits a finite physical avoidance path',scene=>{const result=findFiniteAttackPath(scene);expect(result.passed).toBe(true);expect(result.sets).toBe(2);expect(result.minBoundaryMargin).toBeGreaterThan(0);});
 it.each(AIRCRAFT_CATALOG)('actual fresh $id engine uses selected physics and resets them only at a new run',craft=>{let now=0;const e=createGameEngine({now:()=>now,aircraftId:craft.id,guestMode:true});e.start();const before=e.getSnapshot();e.lift();now+=50;e.update(now);const after=e.getSnapshot();expect(after.aircraft.id).toBe(craft.id);expect(after.player.y).toBeLessThan(before.player.y);expect(after.player.velocityY).toBeCloseTo(-360*craft.liftMultiplier+900*craft.gravityMultiplier*.05);expect(after.difficulty.scrollSpeed).toBeGreaterThanOrEqual(240*craft.scrollSpeedMultiplier);expect(before.bossCadence.target).toBe(20);});
 it('retains first three pattern order and one special timing window across wall tiers',()=>{expect([1,2,3].map(n=>chooseBossPattern(()=>.99,n))).toEqual(['slow','fast','shift']);for(const n of [1,2,3,4,7])expect(getBossWallRules(n).timingWindowSeconds).toBe(.3);});
});

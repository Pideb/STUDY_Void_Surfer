import {describe,it,expect} from 'vitest';
import * as C from '../../src/game/constants.js';
import {AIRCRAFT_CATALOG} from '../../src/game/aircraft.js';
import {getBaseSpeed} from '../../src/game/difficulty.js';
import {isSpecialTimingSuccess} from '../../src/game/collision.js';
import {updatePlayer,applyLift} from '../../src/game/player.js';
import {targetSpeed,specialEligibility,timingSpan,simulateFlight,hybridGapSafe} from '../../docs/management/lab-model.mjs';
import {projectileTargetSpeed} from '../../docs/management/lab-model.mjs';
import {collectGameCatalog} from '../../scripts/game-catalog.mjs';
import {getBossWallRules} from '../../src/game/difficulty.js';
import {sampleProjectileSpeed} from '../../src/game/projectile-speed.js';
import {createChallenge} from '../../src/game/wasd-challenge.js';
describe('management preview parity',()=>{
  it('reads current boss tiers, cadence and challenge times instead of archived tuning',()=>{
    const data=collectGameCatalog();expect(data.bossCadence).toMatchObject({firstWalls:20,repeatWalls:15,resetAt:'stage-arrival'});expect(data.feedbackAccess.expiresAtBase).toBe('0.3');expect(data.ranking.durationVisible).toBe(false);
    for(const rule of data.bossWallRules)expect(rule).toMatchObject(getBossWallRules(rule.boss));
    for(const c of data.challenges){expect(c.seconds).toBe(createChallenge({bossNumber:c.boss}).timeLimitSeconds);expect(c.min).toBeGreaterThanOrEqual(4);}
    expect(data.unlocks.find(u=>u.id==='boss1').trigger).toBe('일반벽 20개');expect(data.uniqueAttacks).toHaveLength(6);expect(data.challengeFeedback.glitchBlackoutSeconds).toBe(.18);
  });
  it('matches actual sampled projectile speeds across clamps and scroll tiers',()=>{const data=collectGameCatalog();for(const speed of[-10000,240,460,575,700,770,10000])for(const roll of[0,.3,.8,1])expect(projectileTargetSpeed(data.projectileSpeed,speed,roll)).toBeCloseTo(sampleProjectileSpeed(speed,()=>roll));});
  it.each(AIRCRAFT_CATALOG)('$name uses the production score-speed curve',craft=>{
    for(var score of [0,9,10,60,219,220,999])expect(targetSpeed(C,craft,score,'normal')).toBe(getBaseSpeed(score,craft.id)*craft.scrollSpeedMultiplier);
    expect(targetSpeed(C,craft,220,'fast')).toBeCloseTo(getBaseSpeed(220,craft.id)*craft.scrollSpeedMultiplier*1.25*(craft.id==='velocity'?.88:1));
  });
  it('matches the production special-wall boundary, including early overlap and collision cutoff',()=>{
    for(var speed of [240,460,700,770])for(var windowSeconds of [.15,.3])for(var wallX of [230,247.99,248,250,300,340,500]){
      expect(specialEligibility(C,{playerX:240,wallX,speed,windowSeconds,hitbox:16,successWidth:56}))
        .toBe(isSpecialTimingSuccess({playerX:240,wallX,speed,windowSeconds}));}
    expect(timingSpan({speed:240,windowSeconds:.3,hitbox:16,successWidth:56}).seconds).toBeCloseTo(.3833333333);
    expect(hybridGapSafe({playerY:270,hitbox:16,gapCenter:270,gapHeight:180})).toBe(true);
    expect(hybridGapSafe({playerY:185,hitbox:16,gapCenter:270,gapHeight:180})).toBe(false);
  });
  it('uses the same discrete gravity/lift reset as the real player',()=>{
    var player={y:270,velocityY:0},step=1/60;applyLift(player,252);
    var preview=simulateFlight({gravity:1170,lift:252,interval:.4,duration:.1,step});
    expect(preview[0].y).toBe(270);
    for(var i=1;i<preview.length;i++){updatePlayer(player,step,1170);expect(preview[i].y).toBeCloseTo(player.y);expect(preview[i].velocity).toBeCloseTo(player.velocityY);}
  });
});

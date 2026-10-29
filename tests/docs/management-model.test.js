import {describe,it,expect} from 'vitest';
import * as C from '../../src/game/constants.js';
import {AIRCRAFT_CATALOG} from '../../src/game/aircraft.js';
import {getBaseSpeed} from '../../src/game/difficulty.js';
import {isSpecialTimingSuccess} from '../../src/game/collision.js';
import {updatePlayer,applyLift} from '../../src/game/player.js';
import {targetSpeed,specialEligibility,timingSpan,simulateFlight,hybridGapSafe} from '../../docs/management/lab-model.mjs';
describe('management preview parity',()=>{
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

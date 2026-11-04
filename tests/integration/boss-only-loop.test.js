import {describe,it,expect} from 'vitest';
import {createGameEngine} from '../../src/game/game-engine.js';
describe('fixed normal-wall boss loop',()=>{
 it.each([0,.99])('uses20 first walls and15 after arrival independent of pauses (rng%s)',roll=>{
 let now=0;const engine=createGameEngine({now:()=>now,gravity:0,rng:()=>roll,stageRng:()=>.5,invincibilityEnabled:true});engine.start();
 let s=engine.getSnapshot(),arrival=null,postClearWalls=new Set(),paused=false,entries=[];
 for(let n=0;n<14000&&entries.length<2;n++){
 if(s.challenge?.active)for(const key of s.challenge.sequence)engine.handleChallengeKey(key);
 if(s.boss?.weapon.ready&&!s.challenge?.active&&Math.abs(270+162*Math.sin((s.boss.motionSeconds+.5)*Math.PI/3)-s.player.y)<30)engine.fire();
 if(s.clearedBossCount===1&&!s.boss&&!s.stage.transition)for(const w of s.obstacles)if(w.bossNumber===null&&w.encounterCycleId===null)postClearWalls.add(w.id);
 if(arrival!==null&&!paused){engine.pause();engine.resume();paused=true;}
 const before=s;now+=100;engine.update(now);s=engine.getSnapshot();
 if(!before.bossEntry&&s.bossEntry){entries.push(s.bossEntry.warningIndex);expect(s.bossCadence.passedCount).toBe(entries.length===1?20:15);expect(s.bossCadence.spawnedCount).toBe(s.bossCadence.target);if(entries.length===2){expect(s.score).toBe(arrival+15-10);expect(s.bossEntry.pattern).toBe('fast');}}
 if(before.stage.transition&&!s.stage.transition){arrival=s.score;expect(s.bossCadence).toMatchObject({target:15,passedCount:0,spawnedCount:1});expect(postClearWalls.size).toBe(0);}
 expect(s.difficulty.isWarning).toBe(false);expect(s.deathEffect).toBeNull();
 }
 expect(entries).toEqual([1,2]);expect(paused).toBe(true);engine.start();expect(engine.getSnapshot().bossCadence).toMatchObject({target:20,passedCount:0,spawnedCount:0});
 });
});

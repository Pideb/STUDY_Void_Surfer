import {describe,it,expect} from 'vitest';
import {createGameEngine} from '../helpers/engine-fixtures.js';

describe('post-boss portal without extra walls',()=>{
  it.each([false,true])('drains existing walls without new IDs or bonus points; kill during walls=%s',duringWalls=>{
    let time=0;
    const engine=createGameEngine({now:()=>time,gravity:0,rng:()=>.6,stageRng:()=>.5,
      guestMode:true,aircraftId:'aegis',initialScore:60,invincibilityEnabled:true,bossBeamContact:()=>true});
    engine.start();let s=engine.getSnapshot();
    const tick=()=>{time+=50;engine.update(time);return engine.getSnapshot();};
    for(let i=0;i<10000;i++){
      if(s.challenge?.active)for(const key of s.challenge.sequence)engine.handleChallengeKey(key);
      const eligible=duringWalls?s.obstacles.some(w=>w.x>700):s.obstacles.length===0&&s.boss?.cyclePhase==='signature';
      if(s.boss?.weapon.ready&&!s.challenge?.active&&eligible&&engine.fire())break;
      s=tick();
    }
    expect(engine.getSnapshot().boss.weapon.firing).not.toBeNull();
    const entryScore=s.score;
    for(let i=0;i<1000&&s.clearedBossCount===0;i++)s=tick();
    expect(s.clearedBossCount).toBe(1);expect(s.score).toBe(entryScore+10);
    if(duringWalls)expect(s.obstacles.length).toBeGreaterThan(0);
    const existing=new Set(s.obstacles.map(w=>w.id));let portalSeen=false,arrived=false;
    for(let i=0;i<2000;i++){
      const before=s;s=tick();
      if(before.stage.transition&&!s.stage.transition){arrived=true;expect(s.bossCadence).toMatchObject({target:15,passedCount:0,spawnedCount:1});break;}
      expect(s.score).toBe(entryScore+10);
      for(const w of s.obstacles)expect(existing.has(w.id)).toBe(true);
      if(!before.stage.transition)for(const w of before.obstacles){
        if(w.x+w.width>s.difficulty.scrollSpeed*.05)expect(s.obstacles.some(next=>next.id===w.id)).toBe(true);
      }
      if(s.stage.transition){portalSeen=true;expect(s.obstacles).toHaveLength(0);}
    }
    expect(portalSeen).toBe(true);expect(arrived).toBe(true);
  });
});

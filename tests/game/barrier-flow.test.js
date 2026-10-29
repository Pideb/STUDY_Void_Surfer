import {describe,it,expect} from 'vitest';
import {createGameEngine} from '../../src/game/game-engine.js';
import {getDashBarrierBounds,isDashObstacle} from '../../src/game/obstacles.js';

describe('mandatory response spacing through real flight',()=>{
  it.each([['default',2000],['velocity',1000]])('keeps ordinary non-special wall cadence for %s',(aircraftId,interval)=>{
    let time=0;const engine=createGameEngine({now:()=>time,gravity:0,guestMode:false,accountBestScore:100,aircraftId,rng:()=>.99});engine.start();
    const spawned=[],seen=new Set();
    for(let i=0;i<70;i++){time+=100;engine.update(time);for(const wall of engine.getSnapshot().obstacles)if(!seen.has(wall.id)){seen.add(wall.id);spawned.push(time);}}
    for(let i=2;i<spawned.length;i++)expect(spawned[i]-spawned[i-1]).toBe(interval);
  });
  it.each(['default','aegis','velocity'].flatMap(aircraft=>[10,60,150].map(score=>[aircraft,score])))('%s at progression %s preserves cooldown recovery and finite quotas',(aircraftId,initialScore)=>{
    let time=0;const rng=()=>0;
    const engine=createGameEngine({now:()=>time,gravity:0,rng,stageRng:rng,guestMode:false,accountBestScore:100,aircraftId,initialScore,invincibilityEnabled:true});
    engine.start();let previous=engine.getSnapshot(),lastPass=null,count=0,bossVerified=false;
    const seen=new Set();
    for(let frame=0;frame<6000&&(!bossVerified||count<5);frame++){
      if(previous.challenge?.active)for(const key of previous.challenge.sequence)engine.handleChallengeKey(key);
      time+=20;engine.update(time);const snapshot=engine.getSnapshot();
      for(const wall of snapshot.obstacles.filter(isDashObstacle)){
        const prior=previous.obstacles.find(old=>old.id===wall.id);
        const x=getDashBarrierBounds(wall).x;
        if(prior&&getDashBarrierBounds(prior).x>snapshot.player.x&&x<=snapshot.player.x&&!seen.has(wall.id)){
          seen.add(wall.id);const a=getDashBarrierBounds(prior).x;
          const passage=(time-20)+(a-snapshot.player.x)/(a-x)*20;
          if(lastPass!==null)expect(passage-lastPass).toBeGreaterThanOrEqual(1200-.01);
          lastPass=passage;count++;
        }
      }
      expect(snapshot.difficulty.isWarning).toBe(false);
      if(snapshot.boss&&snapshot.warning.spawnedCount===snapshot.warning.targetCount&&snapshot.warning.remainingSpecials===0){expect(snapshot.warning.specialSpawnedCount).toBeGreaterThanOrEqual(3);expect(snapshot.warning.spawnedCount-snapshot.warning.specialSpawnedCount).toBeGreaterThanOrEqual(2);bossVerified=true;}
      expect(snapshot.deathEffect).toBeNull();previous=snapshot;
    }
    expect(count).toBeGreaterThanOrEqual(5);expect(bossVerified).toBe(true);
    engine.start();expect(engine.getSnapshot().obstacles).toHaveLength(0);
  });
});

import {describe,it,expect} from 'vitest';
import {createGameEngine} from '../../src/game/game-engine.js';
import {isDashObstacle} from '../../src/game/obstacles.js';

describe('distributed signature budgets with unrestricted special-wall overlap',()=>{
  it.each([[0,1],[.4,2],[.99,3]])('roll %s uses exactly %s volleys before WASD, including mid-wave attacks',(roll,budget)=>{
    let time=0;const engine=createGameEngine({now:()=>time,gravity:0,rng:()=>roll,stageRng:()=>.5,
      initialScore:60,initialCompletedWarningCount:3,guestMode:true,invincibilityEnabled:true});
    engine.start();const ids=new Set();let overlap=false,normalOverlap=false,spawnsDuringVolley=false;
    let snapshot=engine.getSnapshot();
    for(let i=0;i<2000&&!snapshot.challenge?.active;i++){
      const before=snapshot;time+=100;engine.update(time);snapshot=engine.getSnapshot();
      if(snapshot.boss?.attack?.type==='volley'&&snapshot.boss.cyclePhase==='walls'){
        ids.add(snapshot.boss.attack.id);
        expect(snapshot.boss.volleyBudget).toBe(budget);
        expect(snapshot.boss.wallSpawningPaused).toBe(false);
        if(snapshot.obstacles.some(isDashObstacle))overlap=true;
        if(snapshot.obstacles.some(w=>w.kind==='normal'))normalOverlap=true;
        if(before.boss?.attack?.id===snapshot.boss.attack.id&&snapshot.warning.spawnedCount>before.warning.spawnedCount)spawnsDuringVolley=true;
      }
    }
    expect(ids.size).toBeLessThanOrEqual(budget);expect(ids.size).toBeGreaterThan(0);expect(snapshot.challenge?.active).toBe(true);
    expect(overlap||normalOverlap).toBe(true);
    if(roll===0){expect(overlap).toBe(true);expect(spawnsDuringVolley).toBe(true);}
    expect(snapshot.boss.hp).toBe(3);
  });
});

import { describe,it,expect } from 'vitest';
import { createUniqueAttack,updateUniqueAttack } from '../../src/game/boss-unique-attacks.js';
import { STAGE_CATALOG } from '../../src/game/stages.js';
const player={x:240,y:270,width:36,height:24};
const originAt=()=>({muzzle:{x:750,y:270},core:{x:790,y:270}});
describe('regional unique blocks',()=>{
  it.each(STAGE_CATALOG.flatMap(stage=>[2,3,4,7].flatMap(boss=>[0,.4,.9].map(roll=>[stage.id,boss,roll]))))('%s boss%s roll%s resolves every shot and set',(stageId,bossNumber,roll)=>{
    const a=createUniqueAttack({stageId,bossNumber,rng:()=>roll});let overlapped=false;
    for(let n=0;n<1800&&!a.resolved;n++){
      updateUniqueAttack(a,.05,player,{originAt,scrollSpeedAt:()=>700,projectileImmune:true});
      for(const set of a.sets){expect(set.warningSeconds).toBe(bossNumber===2?2:1.5);if(set.phase==='warning'&&a.sets.some(s=>s!==set&&s.projectiles.some(p=>p.state==='flying')))overlapped=true;}
    }
    expect(a.resolved).toBe(true);expect(a.setsStarted).toBe(1+Math.floor(roll*3));expect(a.hitPlayer).toBe(false);
    for(const set of a.sets){expect(set.projectiles).toHaveLength(({ 'crystal-gates':4,'industrial-void':3,'signal-monoliths':12,'gravity-well':5,'abyssal-beast':6,'solar-forge':6})[stageId]);expect(set.projectiles.every(p=>p.launched&&p.speed>=381&&p.speed<=521)).toBe(true);}
    if(bossNumber<=3)expect(overlapped).toBe(false);
    else if(a.setsPlanned>1)expect(overlapped).toBe(true);
  });
  it('locks industrial aim halfway through warning and keeps the target across shots',()=>{
    const a=createUniqueAttack({stageId:'industrial-void',bossNumber:2,rng:()=>0});
    updateUniqueAttack(a,.9,{...player,y:100},{originAt});expect(a.sets[0].lockedAim).toBeNull();
    updateUniqueAttack(a,.1,{...player,y:220},{originAt});expect(a.sets[0].lockedAim.y).toBe(220);
    for(let n=0;n<40;n++)updateUniqueAttack(a,.05,{...player,y:400},{originAt,projectileImmune:true});
    expect(a.sets[0].projectiles.map(p=>p.targetY)).toEqual([220,220,220]);
  });
  it('includes split children in launch completion and registers unprotected contacts',()=>{
    const a=createUniqueAttack({stageId:'crystal-gates',bossNumber:4,rng:()=>.9});updateUniqueAttack(a,1.6,player,{originAt});expect(a.setsStarted).toBe(1);expect(a.sets[0].allLaunched).toBe(false);
    const b=createUniqueAttack({stageId:'industrial-void',bossNumber:2,rng:()=>0});for(let n=0;n<200&&!b.resolved;n++)updateUniqueAttack(b,.05,player,{originAt});expect(b.hitPlayer).toBe(true);
  });
});

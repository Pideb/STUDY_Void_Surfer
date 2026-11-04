import {describe,it,expect} from 'vitest';
import {createGameEngine} from '../helpers/engine-fixtures.js';
import {getPlayerBounds} from '../../src/game/player-geometry.js';

function simulation({rng=()=>.6,...options}={}){
  let time=0;
  const engine=createGameEngine({now:()=>time,gravity:0,rng,stageRng:()=>.5,guestMode:true,
    invincibilityEnabled:true,initialScore:220,initialNextBossScore:1000,initialClearedBossCount:2,...options});
  engine.start();
  return{engine,tick:(dt=.02)=>{time+=dt*1000;engine.update(time);return engine.getSnapshot();},time:()=>time};
}

describe('line lasers preserve wall cadence',()=>{
  it.each(['default','velocity'])('%s spawns at identical times with or without ambient lasers',aircraftId=>{
    const withLaser=simulation({aircraftId}),without=simulation({aircraftId,rng:()=>.99});
    const times=[[],[]],ids=[new Set(),new Set()];let fires=0,warningsDuringWall=false;
    for(let i=0;i<1000;i++){
      const snapshots=[withLaser.tick(),without.tick()];
      snapshots.forEach((s,index)=>{for(const wall of s.obstacles)if(!ids[index].has(wall.id)){ids[index].add(wall.id);times[index].push(i);}});
      const s=snapshots[0],attack=s.ambientAttack,bounds=getPlayerBounds(s.player);
      if(attack?.telegraphRemainingSeconds>0&&s.obstacles.some(w=>w.x<=bounds.right&&w.x+w.width>=bounds.left))warningsDuringWall=true;
      if(attack?.activated&&(attack.activeRemainingSeconds>0||attack.damageWindow)){
        fires++;
        expect(s.obstacles.some(w=>w.x<=bounds.right&&w.x+w.width>=bounds.left)).toBe(false);
      }
    }
    expect(times[0]).toEqual(times[1]);expect(times[0].length).toBeGreaterThan(5);
    expect(fires).toBeGreaterThan(0);
    // Warning is permitted to overlap walls; actual contact above must not.
    if(aircraftId==='velocity')expect(warningsDuringWall).toBe(true);
  });
  it('keeps boss inline warnings and shots from pausing a seven-wall wave',()=>{
    const {engine,tick}=simulation({initialNextBossScore:20,initialClearedBossCount:3});let seen=false;
    for(let i=0;i<12000;i++){
      const s=engine.getSnapshot();if(s.challenge?.active)for(const key of s.challenge.sequence)engine.handleChallengeKey(key);
      const next=tick(.05),attack=next.boss?.attack;
      if(attack?.kind==='single'){
        seen=true;expect(next.boss.wallSpawningPaused).toBe(false);
        if(attack.activated&&(attack.activeRemainingSeconds>0||attack.damageWindow)){const b=getPlayerBounds(next.player);
          expect(next.obstacles.some(w=>w.x<=b.right&&w.x+w.width>=b.left)).toBe(false);
        }
      }
      if(seen&&next.boss?.cycleNumber>=2)break;
    }
    expect(seen).toBe(true);
  });
});

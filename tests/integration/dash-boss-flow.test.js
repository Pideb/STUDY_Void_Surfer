import {describe,it,expect} from 'vitest';
import {createGameEngine} from '../../src/game/game-engine.js';
import {getDashBarrierBounds,isDashObstacle} from '../../src/game/obstacles.js';

const cases=['default','aegis','velocity'].flatMap(aircraft=>[60,150].flatMap(score=>[.1,.5,.9].map(roll=>[aircraft,score,roll])));
describe('dash, mixed walls and distributed boss cycles',()=>{
  it.each(cases)('%s score=%s pattern-roll=%s completes retries, clears and portals without losing spacing',(aircraftId,initialScore,roll)=>{
    let time=0;const engine=createGameEngine({now:()=>time,gravity:0,rng:()=>roll,stageRng:()=>.5,
      aircraftId,guestMode:false,accountBestScore:100,initialScore,initialCompletedWarningCount:1,invincibilityEnabled:true});
    engine.start();let snapshot=engine.getSnapshot(),clears=0,portals=0,failed=false,lastPass=null;
    const seenPasses=new Set(),volleyIds=new Map(),checkedCycles=new Set();
    let specialOverlap=false,roarTicks=0;
    for(let frame=0;frame<12000&&(clears<2||portals<2);frame++){
      const boss=snapshot.boss;
      if(boss){
        const key=boss.number+':'+boss.cycleNumber;
        if(!volleyIds.has(key))volleyIds.set(key,new Set());
        if(boss.attack?.type==='volley'){
          volleyIds.get(key).add(boss.attack.id);
          if(snapshot.obstacles.some(isDashObstacle))specialOverlap=true;
          for(const shot of boss.attack.projectiles)if(shot.state==='resolved'&&!shot.hitPlayer){
            expect(shot.x+8<=1e-7||shot.y+5.5<=1e-7||shot.y-5.5>=540-1e-7).toBe(true);
          }
        }
        if(snapshot.challenge?.active&&!checkedCycles.has(key)){
          checkedCycles.add(key);
          const frozen=snapshot;time+=50;engine.update(time);snapshot=engine.getSnapshot();
          expect(snapshot.elapsedSeconds).toBe(frozen.elapsedSeconds);
          expect(snapshot.player).toEqual(frozen.player);
          if(!failed){const wrong=['KeyW','KeyA','KeyS','KeyD'].find(code=>code!==snapshot.challenge.sequence[0]);engine.handleChallengeKey(wrong);failed=true;}
          else for(const code of snapshot.challenge.sequence)engine.handleChallengeKey(code);
        }
      }
      if(!snapshot.challenge?.active&&snapshot.player.dashCooldownRemainingSeconds===0)engine.dash();
      const aim=engine.getSnapshot();
      if(aim.boss?.cycleNumber>=3 && aim.boss.weapon.ready && Math.abs(270+162*Math.sin((aim.boss.motionSeconds+.5)*Math.PI/3)-aim.player.y)<30)engine.fire();
      const before=engine.getSnapshot();time+=50;engine.update(time);snapshot=engine.getSnapshot();
      expect(snapshot.deathEffect).toBeNull();expect(snapshot.aircraft.id).toBe(aircraftId);
      if(before.boss?.roar){roarTicks++;expect(snapshot.elapsedSeconds).toBeCloseTo(before.elapsedSeconds+.05);}
      if(before.boss&&!snapshot.boss){clears++;expect(snapshot.score).toBe(before.score+10);}
      if(before.stage.transition&&!snapshot.stage.transition)portals++;
      if(snapshot.stage.transition)expect(snapshot.stage.transition.crossingY).toBe(270);
      for(const wall of snapshot.obstacles.filter(isDashObstacle)){
        const prior=before.obstacles.find(old=>old.id===wall.id);if(!prior||seenPasses.has(wall.id))continue;
        const a=getDashBarrierBounds(prior).x,b=getDashBarrierBounds(wall).x;
        if(a>snapshot.player.x&&b<=snapshot.player.x){
          const crossed=time-50+(a-snapshot.player.x)/(a-b)*50;
          if(lastPass!==null)expect(crossed-lastPass).toBeGreaterThanOrEqual(1200-.1);
          lastPass=crossed;seenPasses.add(wall.id);
        }
      }
    }
    expect(clears).toBe(2);expect(portals).toBe(2);expect(failed).toBe(true);expect(checkedCycles.size).toBeGreaterThanOrEqual(3);
    expect(roarTicks).toBeGreaterThan(0);
    if(roll===.1)expect(specialOverlap).toBe(true);
    engine.start();expect(engine.getSnapshot()).toMatchObject({score:initialScore,player:{dashCooldownRemainingSeconds:0},boss:null});
  });
});

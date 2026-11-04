import {describe,it,expect} from 'vitest';
import {createGameEngine} from '../helpers/engine-fixtures.js';

function setup() {
  let time=0;
  const engine=createGameEngine({now:()=>time,rng:()=>.9,initialScore:60,guestMode:true,invincibilityEnabled:true});
  engine.start();
  const tick=(dt=.05)=>{time+=dt*1000;engine.update(time);return engine.getSnapshot();};
  const until=predicate=>{
    for(let i=0;i<6000;i++){
      const s=engine.getSnapshot();if(predicate(s))return s;
      if(s.challenge?.active)for(const key of s.challenge.sequence)engine.handleChallengeKey(key);
      if(s.player.y>280&&s.player.velocityY>=0)engine.lift();
      tick();
    }
    throw Error('Recovery fixture timed out');
  };
  return{engine,tick,until};
}

describe('recovery at control-unlock boundaries',()=>{
  it.each(['success','failure'])('starts a .3s ramp after WASD %s and accepts normal lift immediately',result=>{
    const {engine,tick,until}=setup();const before=until(s=>s.challenge?.active);
    if(result==='success')for(const key of before.challenge.sequence)engine.handleChallengeKey(key);
    else for(let i=0;i<100&&engine.getSnapshot().challenge?.active;i++)tick(.1);
    const recovered=engine.getSnapshot();
    expect(recovered.playerRecovery.remainingSeconds).toBe(.3);
    expect(recovered.player.velocityY).toBe(Math.min(0,before.player.velocityY));
    engine.pause();tick(.1);expect(engine.getSnapshot().playerRecovery.remainingSeconds).toBe(.3);engine.resume();
    expect(engine.lift()).toBe(true);
    expect(engine.getSnapshot().player.velocityY).toBe(-360);
    expect(engine.getSnapshot().playerRecovery.remainingSeconds).toBe(0);
  });
  it('clears falling momentum before the unlocked fraction of a firing frame',()=>{
    const {engine,tick,until}=setup();
    until(s=>s.boss?.weapon.ready&&!s.challenge?.active&&s.player.velocityY>30);
    const before=engine.getSnapshot();expect(engine.fire()).toBe(true);
    for(let i=0;i<10;i++)tick(.069);
    expect(engine.getSnapshot().player.y).toBe(before.player.y);
    const after=tick(.07);
    expect(after.boss.weapon.firing).toBeNull();
    expect(after.player.velocityY).toBeCloseTo(900*.06*.1);
    expect(after.player.y-before.player.y).toBeCloseTo(900*.06*.1*.06);
    expect(after.playerRecovery.remainingSeconds).toBeCloseTo(.24);
    expect(engine.lift()).toBe(true);expect(engine.getSnapshot().player.velocityY).toBe(-360);
    engine.start();expect(engine.getSnapshot().playerRecovery.remainingSeconds).toBe(0);
  });
  it('preserves upward motion through the shot and does not restart recovery every frame',()=>{
    const {engine,tick,until}=setup();until(s=>s.boss?.weapon.ready&&!s.challenge?.active);
    engine.lift();engine.fire();for(let i=0;i<7;i++)tick(.1);
    expect(engine.getSnapshot().player.velocityY).toBe(-360);
    expect(engine.getSnapshot().playerRecovery.remainingSeconds).toBeCloseTo(.3);
    tick(.05);expect(engine.getSnapshot().playerRecovery.remainingSeconds).toBeCloseTo(.25);
  });
});

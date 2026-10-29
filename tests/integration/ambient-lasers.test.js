import {describe,it,expect} from 'vitest';
import {createGameEngine} from '../../src/game/game-engine.js';
import {isLaserPathSafe} from '../../src/game/boss-attacks.js';
function setup(extra={}){
  let time=0,roll=.6;const engine=createGameEngine({now:()=>time,gravity:0,rng:()=>roll,initialScore:10,initialCompletedWarningCount:4,invincibilityEnabled:true,...extra});engine.start();
  return {engine,setRoll:v=>roll=v,tick:(dt=.05)=>{time+=dt*1000;engine.update(time);return engine.getSnapshot();}};
}
describe('ambient line lasers',()=>{
  it.each([0,2])('does not unlock after%s completed warnings',initialCompletedWarningCount=>{
    const {tick}=setup({initialCompletedWarningCount});for(let i=0;i<200;i++)expect(tick().ambientAttack).toBeNull();
  });
  it.each([10,60])('attempts at3s in normal/WARNING flight score%s and freezes on pause',initialScore=>{
    const {engine,tick}=setup({initialScore});let s;
    for(let i=0;i<59;i++){s=tick();expect(s.ambientAttack).toBeNull();}
    s=tick();expect(s.ambientAttack?.type).toBe('laser');expect(s.boss).toBeNull();expect(s.clearedBossCount).toBe(2);
    expect(s.ambientAttack.telegraphRemainingSeconds).toBe(.7);
    for(const wall of s.obstacles.filter(w=>w.kind==='normal'))for(const y of s.ambientAttack.ys)expect(isLaserPathSafe(y,wall)).toBe(true);
    const copy=engine.getSnapshot();copy.ambientAttack.ys[0]=-999;expect(engine.getSnapshot().ambientAttack.ys[0]).not.toBe(-999);
    engine.pause();tick();expect(engine.getSnapshot().ambientAttack).toEqual(s.ambientAttack);engine.resume();
    const count=s.obstacles.length;for(let i=0;i<38;i++)s=tick();expect(s.ambientAttack).toBeNull();expect(s.obstacles.length).toBeLessThanOrEqual(count);
    engine.start();expect(engine.getSnapshot().ambientAttack).toBeNull();
  });
  it('consumes failed attempts and permits safe two-line shots without backlog',()=>{
    const {engine,tick,setRoll}=setup();let s;for(let i=0;i<59;i++)s=tick();setRoll(.9);s=tick();expect(s.ambientAttack).toBeNull();
    setRoll(.6);for(let i=0;i<59;i++){s=tick();expect(s.ambientAttack).toBeNull();}setRoll(.1);s=tick();
    expect(s.ambientAttack.ys.length).toBeGreaterThanOrEqual(1);expect(s.ambientAttack.ys.length).toBeLessThanOrEqual(2);
    const two=setup();for(let i=0;i<59;i++)two.tick();two.setRoll(.1);const doubled=two.tick();
    expect(doubled.ambientAttack.ys).toHaveLength(2);expect(doubled.ambientAttack.ys[0]).not.toBe(doubled.ambientAttack.ys[1]);
    expect(engine.getSnapshot().boss).toBeNull();
  });
  it('drains ambient warning/fire/fade before dark boss entry',()=>{
    const {engine,tick}=setup({initialScore:72});let s,seen=false;
    for(let i=0;i<2500;i++){
      s=tick();if(s.ambientAttack){seen=true;expect(s.boss).toBeNull();expect(s.bossEntry?.phase??'draining').toBe('draining');}
      if(s.bossEntry&&s.bossEntry.phase!=='draining'){expect(s.ambientAttack).toBeNull();expect(s.obstacles).toHaveLength(0);break;}
    }
    expect(seen).toBe(true);expect(s.bossEntry).not.toBeNull();engine.stop();expect(engine.getSnapshot().ambientAttack).toBeNull();
  });
  it.each([false,true])('Space does not shield a real laser contact; admin immunity=%s',immune=>{
    const {engine,tick}=setup();let s;
    for(let i=0;i<100;i++){s=tick();if(s.ambientAttack?.activeElapsedSeconds>=.3)break;}
    expect(s.ambientAttack).not.toBeNull();expect(engine.lift()).toBe(true);expect(engine.dash()).toBe(true);
    engine.setInvincibilityEnabled(immune);
    for(let i=0;i<6;i++){s=tick();if(s.deathEffect)break;}
    expect(s.deathEffect?.reason??null).toBe(immune?null:'laser');
  });
});

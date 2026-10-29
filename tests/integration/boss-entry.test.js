import {describe,it,expect} from 'vitest';
import {createGameEngine} from '../../src/game/game-engine.js';

function setup(options={}){let now=0;const engine=createGameEngine({now:()=>now,gravity:0,guestMode:true,invincibilityEnabled:true,rng:()=>.5,...options});engine.start();return{engine,tick:(dt=.05)=>{now+=dt*1000;engine.update(now);return engine.getSnapshot();}};}
function until(engine,tick,predicate){for(let i=0;i<3000;i++){const s=engine.getSnapshot();if(predicate(s))return s;tick();}throw Error('Fixture timeout');}

describe('drained dark boss entry',()=>{
  it('stops ordinary spawns, drains every old wall and keeps normal factors before the alert',()=>{
    const {engine,tick}=setup({initialScore:29,initialCompletedWarningCount:1});
    let s=until(engine,tick,s=>s.bossEntry?.phase==='draining');
    expect(s.obstacles.length).toBeGreaterThan(0);const ids=new Set(s.obstacles.map(w=>w.id));
    while(s.bossEntry?.phase==='draining'){
      expect(s.boss).toBeNull();expect(s.bossPreview).toBeNull();
      expect(s.stage.mode).toBe('normal');expect(s.difficulty.speedMultiplier).toBe(1);
      expect(s.obstacles.every(w=>ids.has(w.id))).toBe(true);s=tick();
    }
    expect(s.obstacles).toHaveLength(0);expect(s.bossEntry.phase).toBe('darkening');
    const dark=[];while(!s.bossPreview){dark.push(s.bossEntry.darkness);expect(s.boss).toBeNull();s=tick();}
    expect(dark.every((v,i)=>i===0||v>=dark[i-1])).toBe(true);expect(s.bossEntry.darkness).toBe(1);
    expect(s.bossPreview.remainingSeconds).toBe(2.4);
    while(!s.boss)s=tick();expect(s.bossEntry).toMatchObject({phase:'entering',darkness:1});
    const fade=[];while(s.bossEntry){fade.push(s.bossEntry.darkness);expect(s.obstacles).toHaveLength(0);expect(s.boss.attack).toBeNull();s=tick();}
    expect(fade.every((v,i)=>i===0||v<=fade[i-1])).toBe(true);expect(s.boss.entranceRemainingSeconds).toBe(0);
  });
  it('keeps flight controls live under blackout and resets the entry on restart/death',()=>{
    const {engine,tick}=setup({initialScore:60,initialCompletedWarningCount:1});
    const s=until(engine,tick,s=>s.bossPreview);expect(engine.lift()).toBe(true);
    expect(tick().player.y).toBeLessThan(s.player.y);engine.stop('manual');
    expect(engine.getSnapshot().bossEntry).toBeNull();engine.start();
    expect(engine.getSnapshot().bossEntry.phase).toBe('draining');expect(engine.getSnapshot().bossPreview).toBeNull();
  });
  it('captures timing-guide width before passage starts WARNING and preserves it behind the player',()=>{
    const {engine,tick}=setup({initialScore:19,rng:()=>0});
    const s=until(engine,tick,s=>s.obstacles.some(w=>w.passed&&w.timingGuideWidthPx!==null));
    const wall=s.obstacles.find(w=>w.passed&&w.timingGuideWidthPx!==null);
    expect(wall.timingGuideWidthPx).toBeCloseTo(75);expect(s.difficulty.timingWindowSeconds).toBe(.15);
    const later=tick().obstacles.find(w=>w.id===wall.id);
    expect(later.timingGuideWidthPx).toBe(wall.timingGuideWidthPx);expect(later.x).toBeLessThan(wall.x);
  });
});

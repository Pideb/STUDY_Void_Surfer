import {describe,it,expect} from 'vitest';
import {createGameEngine} from '../../src/game/game-engine.js';

describe('captured boss background travel',()=>{
  it.each([0,.4,.9])('keeps background constant for boss pattern roll%s',roll=>{
    let time=0;const engine=createGameEngine({now:()=>time,gravity:0,rng:()=>roll,initialScore:200,initialCompletedWarningCount:1,invincibilityEnabled:true});engine.start();
    const tick=()=>{time+=100;engine.update(time);return engine.getSnapshot();};
    let s;for(let i=0;i<100;i++){s=tick();if(s.boss&&!s.bossEntry)break;}
    expect(s.boss).not.toBeNull();const speed=s.backgroundScrollSpeed;expect(speed).toBe(440);
    const wallSpeeds=new Set();
    for(let i=0;i<150;i++){
      if(s.challenge?.active){const frozen=s;tick();expect(engine.getSnapshot().backgroundScrollDistancePx).toBe(frozen.backgroundScrollDistancePx);for(const key of s.challenge.sequence)engine.handleChallengeKey(key);s=engine.getSnapshot();}
      const before=s;s=tick();wallSpeeds.add(s.difficulty.scrollSpeed.toFixed(1));
      expect(s.backgroundScrollSpeed).toBe(speed);expect(s.backgroundScrollDistancePx-before.backgroundScrollDistancePx).toBeCloseTo(speed*.025);
    }
    if(roll===.9)expect(wallSpeeds.size).toBeGreaterThan(5);
    engine.pause();const frozen=engine.getSnapshot();tick();expect(engine.getSnapshot().backgroundScrollDistancePx).toBe(frozen.backgroundScrollDistancePx);
    engine.start();expect(engine.getSnapshot().backgroundScrollDistancePx).toBe(0);
  });
});

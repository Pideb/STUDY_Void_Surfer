import {describe,it,expect} from 'vitest';
import {createBossPatternRound} from '../../src/game/boss-patterns.js';
import {createGameEngine} from "../helpers/engine-fixtures.js";

describe('shuffled complete boss rounds',()=>{
  it('adds a second unique in roughly half the rounds and never duplicates other blocks',()=>{
    let state=9817,extra=0,previous=null;
    const rng=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    for(let i=0;i<10000;i++){
      const round=createBossPatternRound(2,rng,previous);
      if(round.length===6)extra++;
      for(const kind of ['walls','signature','global','challenge'])expect(round.filter(x=>x===kind)).toHaveLength(1);
      expect(round[0]).not.toBe(previous);
      expect([previous,...round].some((x,j,a)=>x==='unique'&&a[j+1]==='unique')).toBe(false);
      previous=round.at(-1);
    }
    expect(extra).toBeGreaterThan(4700);expect(extra).toBeLessThan(5300);
    expect(createBossPatternRound(2,()=>.499)).toHaveLength(6);
    expect(createBossPatternRound(2,()=>.5)).toHaveLength(5);
  });
  it('includes every eligible block and permits every first position',()=>{
    const first=new Set();
    for(let seed=0;seed<10000;seed++){
      let n=seed;const rng=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
      const round=createBossPatternRound(2,rng);first.add(round[0]);
      expect([...new Set(round)].sort()).toEqual(['challenge','global','signature','unique','walls']);
      expect(round.filter(x=>x==='unique').length).toBeGreaterThanOrEqual(1);
      expect(round.filter(x=>x==='unique').length).toBeLessThanOrEqual(2);
      const next=createBossPatternRound(2,rng,round.at(-1));expect(next[0]).not.toBe(round.at(-1));
      const joined=[...round,...next];
      expect(joined.some((x,i)=>x==='unique'&&joined[i+1]==='unique')).toBe(false);
      expect(createBossPatternRound(1,rng)).not.toContain('global');
    }
    expect(first.size).toBe(5);
    for(const value of [NaN,Infinity,-1,1])expect(new Set(createBossPatternRound(2,()=>value)).size).toBe(5);
  });
  it.each([1,2,7])('boss%s completes three whole rounds with no incompatible overlap',number=>{
    let time=0,n=number;const rng=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
    const engine=createGameEngine({now:()=>time,gravity:0,rng,initialScore:200,initialCompletedWarningCount:number*2-1,guestMode:true,invincibilityEnabled:true});engine.start();
    const rounds=new Map(),entries=new Map();let previous=null,s;
    for(let frame=0;frame<18000;frame++){
      time+=100;engine.update(time);s=engine.getSnapshot();const boss=s.boss;if(!boss)continue;
      expect(s.deathEffect).toBeNull();
      if(!rounds.has(boss.cycleNumber)){
        rounds.set(boss.cycleNumber,[...boss.patternQueue]);
        if(previous)expect(boss.patternQueue[0]).not.toBe(previous.at(-1));previous=[...boss.patternQueue];
        const copy=engine.getSnapshot();copy.boss.patternQueue.length=0;copy.boss.completedPatterns.push('corruption');
        expect(engine.getSnapshot().boss.patternQueue.length).toBe(boss.patternQueue.length);
        expect(engine.getSnapshot().boss.completedPatterns).not.toContain('corruption');
      }
      const pattern=boss.patternQueue[boss.patternIndex];
      if(!['pending','defeated'].includes(boss.cyclePhase)){
        const key=boss.cycleNumber;const seen=entries.get(key)??new Set();seen.add(pattern);entries.set(key,seen);
        if(pattern!=='walls')expect(s.obstacles).toHaveLength(0);
      }
      if(boss.roar||s.challenge?.active)expect(boss.attack).toBeNull();
      if(s.challenge?.active)for(const code of s.challenge.sequence)engine.handleChallengeKey(code);
      if(boss.cycleNumber>=4)break;
    }
    expect(s.boss.cycleNumber).toBe(4);
    for(let i=1;i<=3;i++)expect([...entries.get(i)].sort()).toEqual(number===1?['challenge','signature','walls']:['challenge','global','signature','unique','walls']);
    expect(s.boss.hp).toBe(3);expect(s.score).toBe(200);
  });
});

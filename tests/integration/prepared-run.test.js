import {describe,it,expect} from 'vitest';
import {createGameEngine} from '../../src/game/game-engine.js';

describe('deferred run simulation',()=>{
  it('freezes every game clock/input without a pause deduction and begins the same run once',()=>{
    let now=0;
    const engine=createGameEngine({now:()=>now,rng:()=>.6,stageRng:()=>.5,initialScore:19});
    engine.start({aircraftId:'aegis',guestMode:false,accountBestScore:100,deferStart:true});
    const before=engine.getSnapshot();
    expect(before.state).toBe('preparing');
    now=11000;engine.update(now);engine.pause();
    expect(engine.lift()).toBe(false);expect(engine.dash()).toBe(false);expect(engine.fire()).toBe(false);
    engine.setAircraft('velocity');engine.setGuestMode(true);engine.setAccountBestScore(0);
    const waiting=engine.getSnapshot();
    expect(waiting.player).toEqual(before.player);expect(waiting.score).toBe(19);
    expect(waiting.progressionScore).toBe(19);expect(waiting.elapsedSeconds).toBe(0);
    expect(waiting.obstacles).toEqual([]);expect(waiting.boss).toBeNull();
    expect(waiting.stage).toEqual(before.stage);expect(waiting.aircraft.id).toBe('aegis');
    expect(engine.beginPreparedRun()).toBe(true);expect(engine.beginPreparedRun()).toBe(false);
    engine.update(now);expect(engine.getSnapshot().elapsedSeconds).toBe(0);
    now+=16;engine.update(now);
    const flying=engine.getSnapshot();expect(flying.elapsedSeconds).toBeCloseTo(.016);
    expect(flying.player.y).toBeGreaterThan(before.player.y);expect(flying.aircraft.id).toBe('aegis');
    expect(flying.stage.id).toBe(before.stage.id);expect(flying.score).toBe(19);
  });
  it('cancels preparation without death and preserves ordinary synchronous starts',()=>{
    const engine=createGameEngine();engine.start({deferStart:true});engine.stop('cancel-preparation');
    expect(engine.getSnapshot().state).toBe('menu');expect(engine.getSnapshot().deathEffect).toBeNull();
    expect(engine.beginPreparedRun()).toBe(false);engine.start();expect(engine.getSnapshot().state).toBe('playing');
  });
});

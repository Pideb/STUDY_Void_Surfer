import { describe, it, expect } from 'vitest';
import { createGameEngine } from '../../src/game/game-engine.js';

function setup(extra = {}) {
  let time = 0;
  const engine = createGameEngine({ now: () => time, gravity: 0, rng: () => .9, stageRng: () => .5,
    initialScore: 60, initialCompletedWarningCount: 1, guestMode: false, accountBestScore: 100, invincibilityEnabled: true, ...extra });
  engine.start();
  const tick = (dt = .05) => { time += dt * 1000; engine.update(time); return engine.getSnapshot(); };
  const until = predicate => { for (let i = 0; i < 6000; i++) { const s = engine.getSnapshot(); if (predicate(s)) return s; tick(); } throw new Error('Timed out'); };
  const finishChallenge = () => { for (const code of engine.getSnapshot().challenge.sequence) engine.handleChallengeKey(code); };
  return { engine, tick, until, finishChallenge };
}

const aimable=s=>s.boss && Math.abs(270+162*Math.sin((s.boss.motionSeconds+.5)*Math.PI/3)-s.player.y)<30;

describe('manual boss laser in real engine', () => {
  it('spends a genuinely missed horizontal shot without damaging or refunding',()=>{
    const {engine,tick,until}=setup();
    const before=until(s=>s.boss?.weapon.ready&&!s.challenge?.active&&Math.abs(Math.sin((s.boss.motionSeconds+.6)*Math.PI/3))>.96);
    expect(engine.fire()).toBe(true);
    const shot=engine.getSnapshot().boss.weapon.firing;
    expect(shot.toX).toBe(960);expect(shot.toY).toBe(before.player.y);
    for(let i=0;i<7;i++)tick(.1);
    const after=engine.getSnapshot();
    expect(after.boss.hp).toBe(3);expect(after.boss.laserHits).toBe(0);
    expect(after.boss.weapon.ready).toBe(false);expect(after.boss.weapon.firing).toBeNull();
    expect(after.boss.weapon.chargeSeconds).toBeCloseTo(.7);
  });
  it.each([['default',3],['aegis',1],['velocity',3]])('%s starts with3HP and clears in%s actual impacts', (aircraftId,hits) => {
    const { engine,tick,until,finishChallenge } = setup({aircraftId});
    const entry=until(s=>s.boss);
    expect(entry.boss).toMatchObject({hp:3,maxHp:3});
    for(let i=0;i<hits;i++){
      for(let frame=0;frame<6000;frame++){
        const s=engine.getSnapshot();if(s.challenge?.active)finishChallenge();
        if(s.boss?.weapon.ready&&!s.challenge?.active&&aimable(s))break;tick();
      }
      const before=engine.getSnapshot();expect(engine.fire()).toBe(true);
      tick(.1);expect(engine.getSnapshot().boss.hp).toBe(before.boss.hp);
      for(let frame=0;frame<3;frame++)tick(.1);
      expect(engine.getSnapshot().boss.hp).toBe(before.boss.hp);
      tick(.1);const impacted=engine.getSnapshot();
      expect(impacted.boss.hp).toBe(aircraftId==='aegis'?0:3-i-1);
      expect(impacted.boss.maxHp).toBe(3);expect(impacted.boss.laserHits).toBe(i+1);
      tick(.1);tick(.1);
    }
    const cleared=until(s=>!s.boss&&s.stage.transition);
    expect(cleared.score).toBe(entry.score+10);tick(.1);expect(engine.getSnapshot().score).toBe(cleared.score);
  });
  it('unlocks physics only for the fraction beyond the0.7s firing action', () => {
    const { engine, tick, until } = setup();
    until(s => s.boss?.weapon.ready && !s.challenge?.active);
    engine.lift(); const before = engine.getSnapshot(); engine.fire();
    for (let i = 0; i < 10; i++) tick(.069);
    expect(engine.getSnapshot().player.y).toBe(before.player.y);
    const after = tick(.07);
    expect(after.player.y).toBeCloseTo(before.player.y + before.player.velocityY * .06);
    expect(after.boss.weapon.firing).toBeNull();
  });
  it('does not protect the firing ship against a real wall contact', () => {
    const { engine, tick, until } = setup();
    until(s => s.boss?.weapon.ready && s.obstacles.some(w => w.kind === 'special' && w.x > 260 && w.x < 300));
    engine.setInvincibilityEnabled(false); expect(engine.fire()).toBe(true);
    let s;
    for (let i = 0; i < 10; i++) { s = tick(.05); if (s.deathEffect) break; }
    expect(s.deathEffect?.reason).toBe('obstacle');
    expect(s.boss.hp).toBe(3);
    for(let i=0;i<20;i++)tick(.1);
    expect(engine.getSnapshot().boss.laserHits).toBe(0);
  });
  it('WASD neither damages nor adds charge, freezes charging while active and restarts waves', () => {
    const { engine, tick, until, finishChallenge } = setup();
    const s = until(s => s.challenge?.active);
    const charge = s.boss.weapon.chargeSeconds;
    tick(.1);
    expect(engine.getSnapshot().boss.weapon.chargeSeconds).toBe(charge);
    expect(engine.fire()).toBe(false);
    finishChallenge();
    expect(engine.getSnapshot().boss.hp).toBe(3);
    expect(engine.getSnapshot().boss.weapon.chargeSeconds).toBe(charge);
    until(s => s.boss?.cycleNumber === 2);
  });
  it('three accepted shots hit once each and clear with normal boss score and portal', () => {
    const { engine, tick, until, finishChallenge } = setup();
    const bossStartScore = until(s => s.boss).score;
    let shots = 0, lastHp = 3;
    for (let i = 0; i < 6000 && engine.getSnapshot().boss?.hp !== 0; i++) {
      const s = engine.getSnapshot();
      if (s.challenge?.active) finishChallenge();
      if (s.boss?.weapon.ready && aimable(s) && engine.fire()) shots++;
      const after = tick();
      if (after.boss) { expect(after.boss.hp).toBeLessThanOrEqual(lastHp); lastHp = after.boss.hp; }
      if (shots === 3 && after.boss?.hp === 0) break;
    }
    expect(shots).toBe(3); expect(lastHp).toBe(0);
    const done = until(s => !s.boss && s.stage.transition);
    expect(done.score).toBe(bossStartScore + 10);
    engine.start(); expect(engine.getSnapshot().boss).toBeNull();
  });
  it('holds ship during charge while walls move, and pauses recharge in the pause screen', () => {
    const { engine, tick, until } = setup();
    until(s => s.boss?.weapon.ready && s.obstacles.length > 0 && !s.challenge?.active && aimable(s));
    const before = engine.getSnapshot();
    expect(engine.fire()).toBe(true);
    expect(engine.lift()).toBe(false); expect(engine.dash()).toBe(false);
    const after = tick(.1);
    expect(after.player.y).toBe(before.player.y);
    expect(after.obstacles[0].x).toBeLessThan(before.obstacles[0].x);
    expect(after.boss.hp).toBe(3);
    for(let frame=0;frame<3;frame++)tick(.1);
    expect(engine.getSnapshot().boss.hp).toBe(3);
    tick(.1); expect(engine.getSnapshot().boss.hp).toBe(2);
    tick(.1);expect(engine.getSnapshot().boss.weapon.firing).not.toBeNull();
    tick(.1); expect(engine.getSnapshot().boss.weapon.firing).toBeNull();
    engine.pause(); const charge = engine.getSnapshot().boss.weapon.chargeSeconds;
    tick(.1); expect(engine.getSnapshot().boss.weapon.chargeSeconds).toBe(charge);
    engine.resume(); tick(.1); expect(engine.getSnapshot().boss.weapon.chargeSeconds).toBeGreaterThan(charge);
    const copy = engine.getSnapshot(); copy.boss.weapon.chargeSeconds = 999;
    expect(engine.getSnapshot().boss.weapon.chargeSeconds).not.toBe(999);
  });
});

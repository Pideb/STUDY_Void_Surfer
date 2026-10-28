import { describe, it, expect } from 'vitest';
import { createGameEngine } from '../../src/game/game-engine.js';

function setup(extra = {}) {
  let time = 0;
  const engine = createGameEngine({ now: () => time, gravity: 0, rng: () => .9, stageRng: () => .5,
    initialScore: 60, initialCompletedWarningCount: 1, guestMode: true, invincibilityEnabled: true, ...extra });
  engine.start();
  const tick = (dt = .05) => { time += dt * 1000; engine.update(time); return engine.getSnapshot(); };
  const until = predicate => { for (let i = 0; i < 6000; i++) { const s = engine.getSnapshot(); if (predicate(s)) return s; tick(); } throw new Error('Timed out'); };
  const finishChallenge = () => { for (const code of engine.getSnapshot().challenge.sequence) engine.handleChallengeKey(code); };
  return { engine, tick, until, finishChallenge };
}

describe('manual boss laser in real engine', () => {
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
      if (s.boss?.weapon.ready && engine.fire()) shots++;
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
    until(s => s.boss?.weapon.ready && s.obstacles.length > 0 && !s.challenge?.active);
    const before = engine.getSnapshot();
    expect(engine.fire()).toBe(true);
    expect(engine.lift()).toBe(false); expect(engine.dash()).toBe(false);
    const after = tick(.1);
    expect(after.player.y).toBe(before.player.y);
    expect(after.obstacles[0].x).toBeLessThan(before.obstacles[0].x);
    expect(after.boss.hp).toBe(3);
    tick(.1); expect(engine.getSnapshot().boss.hp).toBe(2);
    tick(.1); expect(engine.getSnapshot().boss.weapon.firing).toBeNull();
    engine.pause(); const charge = engine.getSnapshot().boss.weapon.chargeSeconds;
    tick(.1); expect(engine.getSnapshot().boss.weapon.chargeSeconds).toBe(charge);
    engine.resume(); tick(.1); expect(engine.getSnapshot().boss.weapon.chargeSeconds).toBeGreaterThan(charge);
    const copy = engine.getSnapshot(); copy.boss.weapon.chargeSeconds = 999;
    expect(engine.getSnapshot().boss.weapon.chargeSeconds).not.toBe(999);
  });
});

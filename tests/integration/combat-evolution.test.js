import { describe, expect, it } from 'vitest';
import { createGameEngine } from '../../src/game/game-engine.js';
import { getBaseSpeed } from '../../src/game/difficulty.js';

describe('approved boss evolution across complete stage cycles', () => {
  it.each(['default', 'aegis', 'velocity'])('completes six distinct stage bosses with retries and portals (%s)', aircraftId => {
    let time = 0, seed = 108;
    const rng = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const engine = createGameEngine({ now: () => time, gravity: 0, rng, stageRng: rng, initialScore: 60, initialCompletedWarningCount: 1, aircraftId, guestMode: false, accountBestScore: 100, invincibilityEnabled: true });
    engine.start();
    const identities = new Set(), failed = new Set(), signatureStages = new Set(), portalStages = new Set();
    let clears = 0, completedPortals = 0, roarFrames = 0, counterattacks = 0, snapshot = engine.getSnapshot();
    for (let frame = 0; frame < 20000 && (clears < 6 || completedPortals < 6); frame++) {
      if (snapshot.boss) {
        identities.add(snapshot.boss.stageId);
        expect(snapshot.boss.stageId).toBe(snapshot.stage.id);
        expect(snapshot.boss.baseScrollSpeed).toBeLessThanOrEqual(getBaseSpeed(200));
        if (snapshot.boss.attack?.type === 'volley') signatureStages.add(snapshot.boss.stageId);
        if (snapshot.boss.attack?.kind === 'quarter') {
          expect(snapshot.obstacles).toHaveLength(0); expect(snapshot.boss.roar).toBeNull();
        }
      }
      if (snapshot.challenge?.active) {
        const number = snapshot.boss.number;
        expect(snapshot.challenge.timeLimitSeconds).toBe(number === 1 ? 5 : 2.8);
        if (!failed.has(number)) {
          const wrong = ['KeyW', 'KeyA', 'KeyS', 'KeyD'].find(code => code !== snapshot.challenge.sequence[snapshot.challenge.cursor]);
          engine.handleChallengeKey(wrong); failed.add(number);
          expect(engine.getSnapshot().feedbackEffect.durationSeconds).toBe(8);
        } else {
          for (const code of snapshot.challenge.sequence.slice(snapshot.challenge.cursor)) engine.handleChallengeKey(code);
          expect(engine.getSnapshot().boss.counterattack).toBeNull();
        }
      }
      const aiming=engine.getSnapshot();
      if(aiming.boss?.successfulChallenges>=1 && aiming.boss.cycleNumber>=3 && aiming.boss.weapon.ready && Math.abs(270+162*Math.sin((aiming.boss.motionSeconds+.5)*Math.PI/3)-aiming.player.y)<30 && engine.fire())counterattacks++;
      const before = engine.getSnapshot(); time += 100; engine.update(time); snapshot = engine.getSnapshot();
      expect(snapshot.aircraft.id).toBe(aircraftId);
      expect(snapshot.deathEffect).toBeNull();
      if (before.boss?.roar) {
        roarFrames++;
        expect(snapshot.elapsedSeconds).toBeCloseTo(before.elapsedSeconds + .1);
        expect(snapshot.player).toEqual(before.player);
      }
      if (before.boss && snapshot.boss) expect(snapshot.score).toBe(before.score);
      if (before.boss && !snapshot.boss) {
        clears++; expect(snapshot.score).toBe(before.score + 10);
        expect(snapshot.stage.mode).toBe('boss');
      }
      if (snapshot.stage.transition) {
        portalStages.add(snapshot.stage.transition.destinationStageId);
        expect(snapshot.boss).toBeNull(); expect(snapshot.bossPreview).toBeNull();
        expect(snapshot.obstacles).toHaveLength(0);
        expect(snapshot.stage.id).toBe(snapshot.stage.transition.swapped
          ? snapshot.stage.transition.destinationStageId : snapshot.stage.transition.fromStageId);
      }
      if (before.stage.transition && !snapshot.stage.transition) completedPortals++;
    }
    expect(clears).toBe(6); expect(identities.size).toBe(6); expect(signatureStages.size).toBe(6);
    expect(portalStages.size).toBeGreaterThanOrEqual(5); expect(failed.size).toBe(6);
    expect(counterattacks).toBe(aircraftId === 'aegis' ? 6 : 18);
    // Six bosses, each with a failed and a successful challenge: at least12 full .8s roars.
    expect(roarFrames).toBeGreaterThanOrEqual(96);
    expect(completedPortals).toBe(6);
    engine.start(); snapshot = engine.getSnapshot();
    expect(snapshot.stage.transition).toBeNull(); expect(snapshot.feedbackEffect).toBeNull();
    expect(snapshot.aircraft.id).toBe(aircraftId); expect(snapshot.score).toBe(60);
  });
});

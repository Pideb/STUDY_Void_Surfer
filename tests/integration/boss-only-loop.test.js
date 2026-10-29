import { describe, it, expect } from 'vitest';
import { createGameEngine } from '../../src/game/game-engine.js';

describe('0.01-b normal/boss loop', () => {
  it.each([0, 1])('starts boss two15..20 points after portal completion, RNG=%s', (roll) => {
    let time = 0;
    const engine = createGameEngine({ now: () => time, gravity: 0, rng: () => roll, stageRng: () => .5,
      initialScore: 19, aircraftId: 'aegis', guestMode: false, accountBestScore: 100, invincibilityEnabled: true });
    engine.start();
    let snapshot = engine.getSnapshot(), firstClearScore = null, arrivalScore = null, secondEntryScore = null;
    let portalPaused = false, normalPaused = false, threshold = null, swapSeen = false;
    const entries = new Set(), bosses = new Set();
    for (let frame = 0; frame < 10000 && snapshot.clearedBossCount < 2; frame += 1) {
      expect(snapshot.difficulty.isWarning).toBe(false);
      expect(snapshot.stage.mode).not.toBe('warning');
      if (snapshot.bossEntry && !entries.has(snapshot.bossEntry.warningIndex)) {
        entries.add(snapshot.bossEntry.warningIndex);
        if (snapshot.bossEntry.warningIndex === 1) expect(snapshot.score).toBe(20);
        if (snapshot.bossEntry.warningIndex === 2) {
          secondEntryScore = snapshot.score;
          expect(arrivalScore).not.toBeNull();
          expect(secondEntryScore).toBe(threshold);
          expect(secondEntryScore - arrivalScore).toBe(roll === 0 ? 15 : 20);
        }
      }
      if (snapshot.boss) {
        bosses.add(snapshot.boss.number);
        expect(snapshot.boss.number).toBe(snapshot.clearedBossCount + 1);
        for (const wall of snapshot.obstacles) expect(wall.bossNumber).toBe(snapshot.boss.number);
      }
      if (snapshot.challenge?.active) {
        for (const key of snapshot.challenge.sequence.slice(snapshot.challenge.cursor)) engine.handleChallengeKey(key);
      }
      if (snapshot.boss?.weapon.ready
        && Math.abs(270 + 162 * Math.sin((snapshot.boss.motionSeconds + .5) * Math.PI / 3) - snapshot.player.y) < 25) engine.fire();
      if (snapshot.clearedBossCount === 1 && snapshot.stage.transition) {
        expect(snapshot.boss).toBeNull();
        expect(snapshot.difficulty.isBoss).toBe(false);
        expect(snapshot.difficulty.nextWarningScore).toBe(Number.MAX_SAFE_INTEGER);
        if (snapshot.stage.transition.swapped) swapSeen = true;
        if (!portalPaused) {
          engine.pause(); engine.resume(); portalPaused = true;
          snapshot = engine.getSnapshot();
          expect(snapshot.score).toBe(firstClearScore - 10);
        }
      }
      if (arrivalScore !== null && snapshot.clearedBossCount === 1 && !snapshot.bossEntry && !snapshot.boss) {
        expect(snapshot.difficulty.nextWarningScore).toBe(threshold);
        expect(snapshot.score).toBeLessThan(threshold);
        if (!normalPaused) {
          engine.pause(); engine.resume(); normalPaused = true;
          snapshot = engine.getSnapshot();
          expect(snapshot.difficulty.nextWarningScore).toBe(threshold);
        }
      }
      const previous = snapshot;
      time += 100; engine.update(time); snapshot = engine.getSnapshot();
      if (previous.clearedBossCount === 1 && previous.stage.transition && !snapshot.stage.transition) {
        expect(swapSeen).toBe(true);
        expect(portalPaused).toBe(true);
        arrivalScore = snapshot.score;
        expect(arrivalScore).toBe(firstClearScore - 10);
        threshold = snapshot.difficulty.nextWarningScore;
        expect(threshold).toBe(arrivalScore + (roll === 0 ? 15 : 20));
        expect(snapshot.bossEntry).toBeNull();
        expect(snapshot.boss).toBeNull();
        expect(snapshot.difficulty.isBoss).toBe(false);
      }
      if (previous.boss && snapshot.clearedBossCount > previous.clearedBossCount) {
        expect(snapshot.score).toBe(previous.score + 10);
        expect(snapshot.progressionScore).toBe(previous.progressionScore + 10);
        if (snapshot.clearedBossCount === 1) {
          firstClearScore = snapshot.score;
          expect(snapshot.specialTimingGuideActive).toBe(false);
          expect(snapshot.difficulty.movingGapChance).toBe(.5);
        }
      }
      if (!snapshot.boss && previous.obstacles.some(wall => wall.bossNumber != null && !wall.passed)
        && snapshot.obstacles.some(wall => wall.bossNumber != null && wall.passed)) {
        const clearAward = snapshot.clearedBossCount > previous.clearedBossCount ? 10 : 0;
        expect(snapshot.score).toBe(previous.score + clearAward);
      }
      if (snapshot.clearedBossCount < 2) expect(snapshot.ambientAttack).toBeNull();
    }
    expect([...entries]).toEqual([1, 2]);
    expect([...bosses]).toEqual([1, 2]);
    expect(secondEntryScore).not.toBeNull();
    expect(snapshot.clearedBossCount).toBe(2);
    expect(normalPaused).toBe(true);
    engine.start();
    expect(engine.getSnapshot().difficulty.nextWarningScore).toBe(20);
  });

  it('keeps the old fixture alias but exposes explicit actual-boss initialization', () => {
    const legacy = createGameEngine({ initialScore: 10, initialCompletedWarningCount: 4 });
    const current = createGameEngine({ initialScore: 10, initialClearedBossCount: 2 });
    legacy.start(); current.start();
    expect(legacy.getSnapshot().clearedBossCount).toBe(2);
    expect(current.getSnapshot().clearedBossCount).toBe(2);
    expect(current.getSnapshot().specialTimingGuideActive).toBe(false);
  });
});

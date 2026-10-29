import { describe, it, expect } from 'vitest';
import { createGameEngine } from '../../src/game/game-engine.js';

describe('0.01-b normal/boss loop', () => {
  it('reaches boss one at20, returns to normal and clears boss two with actual-count unlocks', () => {
    let time = 0;
    const engine = createGameEngine({ now: () => time, gravity: 0, rng: () => .6, stageRng: () => .5,
      initialScore: 19, aircraftId: 'aegis', guestMode: false, accountBestScore: 100, invincibilityEnabled: true });
    engine.start();
    let snapshot = engine.getSnapshot(), firstClearScore = null, secondEntryScore = null;
    const entries = new Set(), bosses = new Set();
    for (let frame = 0; frame < 10000 && snapshot.clearedBossCount < 2; frame += 1) {
      expect(snapshot.difficulty.isWarning).toBe(false);
      expect(snapshot.stage.mode).not.toBe('warning');
      if (snapshot.bossEntry && !entries.has(snapshot.bossEntry.warningIndex)) {
        entries.add(snapshot.bossEntry.warningIndex);
        if (snapshot.bossEntry.warningIndex === 1) expect(snapshot.score).toBe(20);
        if (snapshot.bossEntry.warningIndex === 2) {
          secondEntryScore = snapshot.score;
          expect(secondEntryScore - firstClearScore).toBeGreaterThanOrEqual(5);
          expect(secondEntryScore - firstClearScore).toBeLessThanOrEqual(8);
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
      const previous = snapshot;
      time += 100; engine.update(time); snapshot = engine.getSnapshot();
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

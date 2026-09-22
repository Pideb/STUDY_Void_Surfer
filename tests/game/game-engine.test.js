import { describe, expect, it } from 'vitest';
import { GAME_STATES } from '../../src/game/game-state.js';
import { createGameEngine } from '../../src/game/game-engine.js';

function createRuntimeEngine(overrides = {}) {
  let currentTime = 0;
  const engine = createGameEngine({
    now: () => currentTime,
    gravity: 0,
    rng: () => 0.5,
    ...overrides,
  });
  return {
    engine,
    step(milliseconds = 100) {
      currentTime += milliseconds;
      engine.update(currentTime);
      return engine.getSnapshot();
    },
  };
}

describe('game engine', () => {
  it('starts a fresh playing session', () => {
    let currentTime = 1000;
    const engine = createGameEngine({ now: () => currentTime });

    engine.start();

    expect(engine.getSnapshot()).toMatchObject({
      state: GAME_STATES.PLAYING,
      score: 0,
      elapsedSeconds: 0,
      player: { x: 240, y: 270 },
    });
  });

  it('lifts the player only during active play', () => {
    const engine = createGameEngine({ now: () => 1000 });
    engine.lift();
    expect(engine.getSnapshot().player.velocityY).toBe(0);

    engine.start();
    engine.lift();
    expect(engine.getSnapshot().player.velocityY).toBeLessThan(0);
  });

  it('spawns the first obstacle then moves it left at the active scroll speed', () => {
    const { engine, step } = createRuntimeEngine();
    engine.start();

    const firstSnapshot = step();
    expect(firstSnapshot.obstacles).toHaveLength(1);
    const firstX = firstSnapshot.obstacles[0].x;

    const movedSnapshot = step();
    expect(movedSnapshot.obstacles[0].x).toBeLessThan(firstX);
    expect(movedSnapshot.difficulty.scrollSpeed).toBe(240);
  });

  it('scores each passed normal obstacle once and starts WARNING at score twenty', () => {
    const { engine, step } = createRuntimeEngine();
    engine.start();
    let snapshot;
    for (let frame = 0; frame < 460; frame += 1) snapshot = step();

    expect(snapshot.score).toBeGreaterThanOrEqual(20);
    expect(snapshot.warning).toMatchObject({
      index: 1,
      targetCount: 5,
      requiredSpecials: 2,
    });
    const before = snapshot.score;
    for (let frame = 0; frame < 5; frame += 1) snapshot = step();
    expect(snapshot.score).toBeGreaterThanOrEqual(before);
  });

  it('uses the shorter warning cadence and guarantees two special walls', () => {
    const { engine, step } = createRuntimeEngine();
    engine.start();
    let snapshot;
    for (let frame = 0; frame < 460; frame += 1) snapshot = step();
    for (let frame = 0; frame < 75; frame += 1) snapshot = step();

    expect(snapshot.warning?.spawnedCount).toBe(5);
    expect(snapshot.warning?.specialSpawnedCount).toBeGreaterThanOrEqual(2);
    expect(snapshot.obstacles.filter((obstacle) => obstacle.warningIndex === 1)
      .every((obstacle) => obstacle.gapHeight === 135)).toBe(true);
  });

  it('runs the fifth warning as a frozen boss segment with seven walls and three specials', () => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 60,
      initialCompletedWarningCount: 4,
    });
    engine.start();
    const initial = engine.getSnapshot();
    expect(initial.difficulty).toMatchObject({ isWarning: true, isBoss: true, bossPattern: 'fast' });
    expect(initial.warning).toMatchObject({ index: 5, targetCount: 7, requiredSpecials: 3 });

    let snapshot;
    let completedSegmentSnapshot;
    for (let frame = 0; frame < 120; frame += 1) {
      const activeTarget = engine.getSnapshot().obstacles
        .find((obstacle) => obstacle.kind === 'special' && obstacle.x >= 240);
      if (!engine.getSnapshot().player.isDashing && activeTarget && activeTarget.x - 240 <= 100) {
        engine.dash();
      }
      snapshot = step();
      if (snapshot.warning?.index === 5 && snapshot.warning.spawnedCount === 7) {
        completedSegmentSnapshot = snapshot;
      }
    }
    expect(completedSegmentSnapshot.warning).toMatchObject({ spawnedCount: 7, specialSpawnedCount: 3 });
    expect(completedSegmentSnapshot.difficulty.bossPattern).toBe('fast');
    expect(completedSegmentSnapshot.difficulty.speedMultiplier).toBe(1.8);
  });

  it('rejects normal/early dashes and grants targeted dash immunity near a special wall', () => {
    const { engine, step } = createRuntimeEngine();
    engine.start();
    expect(engine.dash()).toBe(false);

    let snapshot;
    for (let frame = 0; frame < 460; frame += 1) snapshot = step();
    for (let frame = 0; frame < 70 && snapshot.warning?.spawnedCount < 4; frame += 1) snapshot = step();
    const target = snapshot.obstacles.find((obstacle) => obstacle.warningIndex === 1 && obstacle.kind === 'special');
    expect(target).toBeDefined();
    expect(engine.dash()).toBe(false);

    while (engine.getSnapshot().obstacles.find((obstacle) => obstacle.id === target.id)?.x > 290) step();
    expect(engine.dash()).toBe(true);
    expect(engine.getSnapshot().player).toMatchObject({ isDashing: true, dashTargetId: target.id });
  });

  it('ends on a normal obstacle collision and returns detached snapshot data', () => {
    const { engine, step } = createRuntimeEngine({ rng: () => 0 });
    engine.start();
    let snapshot;
    for (let frame = 0; frame < 50 && snapshot?.state !== GAME_STATES.GAME_OVER; frame += 1) snapshot = step();

    expect(snapshot).toMatchObject({ state: GAME_STATES.GAME_OVER, gameOverReason: 'obstacle' });
    const copied = engine.getSnapshot();
    copied.player.y = 999;
    copied.obstacles[0].x = 999;
    expect(engine.getSnapshot().player.y).not.toBe(999);
    expect(engine.getSnapshot().obstacles[0].x).not.toBe(999);
  });

  it('clamps a large frame delta to the maximum step', () => {
    let currentTime = 1000;
    const engine = createGameEngine({ now: () => currentTime });
    engine.start();

    engine.update(11000);

    expect(engine.getSnapshot().elapsedSeconds).toBe(0.1);
  });

  it('does not update physics or score while paused', () => {
    let currentTime = 1000;
    const engine = createGameEngine({ now: () => currentTime, initialScore: 15 });
    engine.start();
    engine.update(1050);
    const beforePause = engine.getSnapshot();

    expect(engine.pause()).toEqual({ score: 5 });
    currentTime = 5000;
    engine.update(5000);
    const whilePaused = engine.getSnapshot();

    expect(whilePaused.state).toBe(GAME_STATES.PAUSED);
    expect(whilePaused.score).toBe(5);
    expect(whilePaused.player.y).toBe(beforePause.player.y);
  });

  it('does not deduct more than once until resumed and paused again', () => {
    let currentTime = 1000;
    const engine = createGameEngine({ now: () => currentTime, initialScore: 15 });
    engine.start();

    expect(engine.pause().score).toBe(5);
    expect(engine.pause().score).toBe(5);
    engine.resume();
    expect(engine.pause().score).toBe(0);
  });

  it('clamps pause score at zero', () => {
    const engine = createGameEngine({ now: () => 1000 });
    engine.start();

    expect(engine.pause()).toEqual({ score: 0 });
  });

  it('ends the game when gravity carries the player into a boundary', () => {
    const engine = createGameEngine({ now: () => 1000, gravity: 100000 });
    engine.start();

    engine.update(1100);

    expect(engine.getSnapshot()).toMatchObject({
      state: GAME_STATES.GAME_OVER,
      gameOverReason: 'boundary',
    });
  });

  it('resumes from pause without applying the paused time as a large delta', () => {
    let currentTime = 1000;
    const engine = createGameEngine({ now: () => currentTime });
    engine.start();
    engine.pause();
    currentTime = 10000;
    engine.resume();
    engine.update(10100);

    expect(engine.getSnapshot().elapsedSeconds).toBe(0.1);
  });
});

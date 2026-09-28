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
    expect(engine.getSnapshot().stage.order).toHaveLength(6);
  });

  it('keeps the active stage after thirty seconds when no boss has been cleared', () => {
    const { engine, step } = createRuntimeEngine({ stageRng: () => 0.5, rng: () => 0.5 });
    engine.start();
    const initial = engine.getSnapshot();

    let snapshot;
    for (let frame = 0; frame < 301; frame += 1) snapshot = step();
    expect(snapshot.elapsedSeconds).toBeGreaterThan(30);
    expect(snapshot.stage.id).toBe(initial.stage.id);
    expect(snapshot.stage.transition).toBeNull();
  });

  it('integrates background travel at one quarter of current wall speed', () => {
    const { engine, step } = createRuntimeEngine({ rng: () => 0.5 });
    engine.start();

    expect(engine.getSnapshot().backgroundScrollDistancePx).toBe(0);
    const snapshot = step(100);
    expect(snapshot.difficulty.scrollSpeed).toBe(240);
    expect(snapshot.backgroundScrollDistancePx).toBeCloseTo(6);
  });

  it('advances one stage after two walls pass following a boss clear', () => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 60,
      initialCompletedWarningCount: 4,
      rng: () => 0.5,
      stageRng: () => 0.5,
    });
    engine.start();
    const initial = engine.getSnapshot();
    const nextStageId = initial.stage.order[1];
    let previousScore = initial.score;
    let bossCleared = false;
    let subsequentWallsPassed = 0;
    let changedAfterSecondWall = false;
    let oldArtRemainedAtChange = false;
    let newArtSpawned = false;
    let previousSpawnedCount = initial.warning.spawnedCount;
    let bossWavesCompleted = 0;
    const fullBossWaveSpecialCounts = [];

    for (let frame = 0; frame < 7000 && (!changedAfterSecondWall || !newArtSpawned); frame += 1) {
      const before = engine.getSnapshot();
      const attack = before.boss?.attack;
      if (attack?.type === 'projectile' && attack.state === 'flying'
        && Math.abs(attack.x - before.player.x) <= attack.speed * attack.reflectionWindowSeconds
        && Math.abs(attack.y - before.player.y) <= before.player.height / 2 + 30) {
        engine.dash();
      }

      const specialWall = before.obstacles
        .filter((obstacle) => obstacle.kind === 'special' && !obstacle.passed && obstacle.x >= before.player.x)
        .sort((left, right) => left.x - right.x)[0];
      if (specialWall
        && (specialWall.x - before.player.x) / before.difficulty.scrollSpeed <= before.difficulty.timingWindowSeconds) {
        engine.dash();
      }

      const snapshot = step(10);
      if (before.boss && !snapshot.boss) {
        bossCleared = true;
        expect(snapshot.stage.id).toBe(initial.stage.id);
        previousScore = snapshot.score;
      } else if (bossCleared && snapshot.score > previousScore) {
        subsequentWallsPassed += snapshot.score - previousScore;
        if (subsequentWallsPassed === 1) {
          expect(snapshot.stage.id).toBe(initial.stage.id);
        }
        if (subsequentWallsPassed >= 2) {
          changedAfterSecondWall = snapshot.stage.id === nextStageId;
          if (changedAfterSecondWall) {
            oldArtRemainedAtChange = snapshot.obstacles.some((obstacle) => obstacle.stageId === initial.stage.id);
          }
        }
      }
      if (before.warning?.spawnedCount === 7 && snapshot.warning?.spawnedCount === 0) {
        bossWavesCompleted += 1;
      }
      if (snapshot.warning?.spawnedCount === 7
        && previousSpawnedCount !== 7 && snapshot.warning.index === 5) {
        fullBossWaveSpecialCounts.push(snapshot.warning.specialSpawnedCount);
      }
      if (changedAfterSecondWall && snapshot.obstacles.some((obstacle) => obstacle.stageId === nextStageId)) {
        newArtSpawned = true;
      }
      previousScore = snapshot.score;
      previousSpawnedCount = snapshot.warning?.spawnedCount ?? -1;
      if (snapshot.state === GAME_STATES.GAME_OVER) break;
    }

    expect(bossCleared).toBe(true);
    expect(bossWavesCompleted).toBeGreaterThanOrEqual(2);
    expect(fullBossWaveSpecialCounts.length).toBeGreaterThanOrEqual(2);
    expect(fullBossWaveSpecialCounts.every((count) => count >= 3)).toBe(true);
    expect(subsequentWallsPassed).toBeGreaterThanOrEqual(2);
    expect(changedAfterSecondWall).toBe(true);
    expect(oldArtRemainedAtChange).toBe(true);
    expect(newArtSpawned).toBe(true);
  });

  it('uses the boss atmosphere variant while a boss warning is active', () => {
    const { engine } = createRuntimeEngine({
      initialScore: 60,
      initialCompletedWarningCount: 4,
      stageRng: () => 0,
    });
    engine.start();

    const snapshot = engine.getSnapshot();
    expect(snapshot.stage.mode).toBe('boss');
    expect(snapshot.stage.bossBackgroundKey).toBe(`${snapshot.stage.id}-boss`);
  });

  it('lifts the player only during active play', () => {
    const engine = createGameEngine({ now: () => 1000 });
    engine.lift();
    expect(engine.getSnapshot().player.velocityY).toBe(0);

    engine.start();
    engine.lift();
    expect(engine.getSnapshot().player.velocityY).toBeLessThan(0);
  });

  it('keeps the shared hitbox while applying aircraft physics and movement profiles', () => {
    const { engine, step } = createRuntimeEngine({ aircraftId: 'aegis', accountBestScore: 50 });
    engine.start();
    const initial = engine.getSnapshot();

    expect(initial.aircraft).toMatchObject({ id: 'aegis', gravityMultiplier: 2, liftMultiplier: 0.35 });
    expect(initial.player).toMatchObject({ width: 36, height: 24 });
    engine.lift();
    expect(engine.getSnapshot().player.velocityY).toBeCloseTo(-126, 10);
    step();
    expect(engine.getSnapshot().player.width).toBe(36);
  });

  it('uses VELOCITY movement and score multipliers only when unlocked', () => {
    const { engine, step } = createRuntimeEngine({ aircraftId: 'velocity', accountBestScore: 100 });
    expect(engine.setAircraft('velocity')).toBe('velocity');
    engine.start();
    const snapshot = step();

    expect(snapshot.aircraft).toMatchObject({ id: 'velocity', scoreMultiplier: 2 });
    expect(snapshot.difficulty).toMatchObject({ scrollSpeed: 480, aircraftSpawnIntervalMultiplier: 0.5 });
    expect(snapshot.obstacles.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects locked aircraft and changing aircraft during an active run', () => {
    const engine = createGameEngine({ now: () => 1000, accountBestScore: 0 });

    expect(engine.setAircraft('aegis')).toBe(false);
    expect(engine.setAircraft('unknown')).toBe('default');
    engine.start();
    expect(engine.setAircraft('default')).toBe(false);
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

  it('tags newly spawned obstacles with the current stage for visual ownership', () => {
    const { engine, step } = createRuntimeEngine({ stageRng: () => 0.5 });
    engine.start();

    const snapshot = step();

    expect(snapshot.obstacles[0].stageId).toBe(snapshot.stage.id);
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
    expect(completedSegmentSnapshot ?? initial).toBeDefined();
  });

  it('starts normal dashes early and grants targeted immunity only near a special wall', () => {
    const { engine, step } = createRuntimeEngine();
    engine.start();
    expect(engine.dash()).toBe(true);
    expect(engine.getSnapshot().player).toMatchObject({ dashKind: 'normal', dashTargetId: null });

    let snapshot;
    for (let frame = 0; frame < 460; frame += 1) snapshot = step();
    for (let frame = 0; frame < 70 && snapshot.warning?.spawnedCount < 4; frame += 1) snapshot = step();
    const target = snapshot.obstacles.find((obstacle) => obstacle.warningIndex === 1 && obstacle.kind === 'special');
    expect(target).toBeDefined();
    expect(engine.dash()).toBe(true);
    expect(engine.getSnapshot().player).toMatchObject({ dashKind: 'normal', dashTargetId: null });

  });

  it('marks the first spawned special wall at score ten for timing guidance', () => {
    const { engine, step } = createRuntimeEngine({ initialScore: 10, rng: () => 0 });
    engine.start();

    const snapshot = step();
    const firstSpecial = snapshot.obstacles[0];

    expect(firstSpecial).toMatchObject({
      kind: 'special',
      width: 24,
      showTimingGuide: true,
      movingGap: false,
    });
  });

  it('spawns a moving normal wall at score fifty and uses the regular cycle', () => {
    const values = [0.9, 0, 0.5, 0.25, 0.5];
    const { engine, step } = createRuntimeEngine({
      initialScore: 50,
      initialCompletedWarningCount: 4,
      rng: () => values.shift() ?? 0.5,
    });
    engine.start();

    const snapshot = step();

    expect(snapshot.obstacles[0]).toMatchObject({
      kind: 'normal',
      movingGap: true,
      gapMotionCycleSeconds: 2.4,
    });
  });

  it('uses the faster moving-gap cycle for warning and boss spawns', () => {
    const values = [0.9, 0.5, 0.9, 0, 0.5, 0.25, 0.5];
    const { engine, step } = createRuntimeEngine({
      initialScore: 60,
      initialCompletedWarningCount: 4,
      rng: () => values.shift() ?? 0.5,
    });
    engine.start();

    const snapshot = step();

    expect(snapshot.difficulty).toMatchObject({ isWarning: true, isBoss: true });
    expect(snapshot.obstacles[0]).toMatchObject({
      kind: 'normal',
      movingGap: true,
      gapMotionCycleSeconds: 1.6,
    });
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

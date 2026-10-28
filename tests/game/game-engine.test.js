import { describe, expect, it } from 'vitest';
import { isLaserPathSafe } from '../../src/game/boss-attacks.js';
import { GAME_STATES } from '../../src/game/game-state.js';
import { constrainGapCenter, createGameEngine } from '../../src/game/game-engine.js';
import { getBaseSpeed } from '../../src/game/difficulty.js';

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
  it('recharges for one live second without refreshing blocked dashes, freezes on pause and resets on restart', () => {
    const { engine, step } = createRuntimeEngine(); engine.start();
    expect(engine.dash()).toBe(true);
    step(100); const before = engine.getSnapshot().player;
    expect(engine.dash()).toBe(false);
    expect(engine.getSnapshot().player).toEqual(before);
    engine.pause(); step(1000);
    expect(engine.getSnapshot().player).toEqual(before);
    engine.resume();
    for (let i = 0; i < 6; i++) step(100);
    expect(engine.getSnapshot().player).toMatchObject({ isDashing: false });
    expect(engine.getSnapshot().player.dashCooldownRemainingSeconds).toBeCloseTo(.3);
    expect(engine.dash()).toBe(false);
    for (let i = 0; i < 3; i++) step(100);
    expect(engine.getSnapshot().player.dashCooldownRemainingSeconds).toBe(0);
    expect(engine.dash()).toBe(true);
    engine.start(); expect(engine.getSnapshot().player.dashCooldownRemainingSeconds).toBe(0);
  });
  it.each(['default', 'aegis', 'velocity'])('keeps the capped aircraft speed after pause deductions (%s)', (aircraftId) => {
    const { engine } = createRuntimeEngine({ initialScore: 200, aircraftId, guestMode: true });
    engine.start();
    const ceiling = getBaseSpeed(150) * (aircraftId === 'velocity' ? 2 : 1);
    expect(engine.getSnapshot().difficulty.scrollSpeed).toBeCloseTo(ceiling);
    engine.pause();
    expect(engine.getSnapshot().progressionScore).toBe(200);
    expect(engine.getSnapshot().difficulty.targetScrollSpeed).toBeCloseTo(ceiling);
  });
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

  it('keeps world boundaries fatal while invincibility is enabled', () => {
    const { engine, step } = createRuntimeEngine({ gravity: 100000 });
    engine.setInvincibilityEnabled(true);
    expect(engine.getSnapshot().invincibilityEnabled).toBe(true);
    engine.start();
    const snapshot = step(100);

    expect(snapshot.gameOverReason).toBe('boundary');
    expect(snapshot.deathEffect?.reason).toBe('boundary');
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

  it.each(['default', 'velocity'])('suspends new walls through every portal phase and resumes without a burst (%s)', (aircraftId) => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 60, initialCompletedWarningCount: 1, rng: () => 0.5,
      aircraftId, guestMode: true,
    });
    engine.setInvincibilityEnabled(true);
    engine.start();
    let snapshot = engine.getSnapshot();
    let transitionIds = null;
    let previous = null;
    let transitionFrames = 0;
    let resumed = false;
    for (let frame = 0; frame < 1800; frame += 1) {
      if (snapshot.challenge?.active) {
        for (const code of snapshot.challenge.sequence) engine.handleChallengeKey(code);
      }
      previous = snapshot;
      snapshot = step();
      if (snapshot.stage.transition) {
        if (!transitionIds) transitionIds = new Map(snapshot.obstacles.map((wall) => [wall.id, wall.stageId]));
        transitionFrames += 1;
        for (const wall of snapshot.obstacles) expect(transitionIds.get(wall.id)).toBe(wall.stageId);
        expect(snapshot.bossPreview).toBeNull();
        const transition = snapshot.stage.transition;
        expect(snapshot.stage.id).toBe(transition.swapped ? transition.destinationStageId : transition.fromStageId);
        expect(snapshot.boss).toBeNull();
        expect(snapshot.warning).toBeNull();
        if (transition.phase === 'lead-in') expect(transition.travelledPixels).toBe(0);
        if (previous.stage.transition?.phase === 'approach') {
          expect(transition.travelledPixels - previous.stage.transition.travelledPixels)
            .toBeCloseTo(Math.min(960 - previous.stage.transition.travelledPixels, snapshot.difficulty.scrollSpeed * 0.1));
        }
        if (['white-out', 'hold', 'reveal'].includes(transition.phase)) {
          expect(transition.travelledPixels).toBe(960);
          expect(transition.progress).toBe(1);
        }
      } else if (previous.stage.transition) {
        expect(snapshot.obstacles.filter((wall) => !transitionIds.has(wall.id))).toHaveLength(1);
        const count = snapshot.obstacles.length;
        expect(step().obstacles.length).toBeLessThanOrEqual(count);
        resumed = true;
        break;
      }
    }
    expect(transitionFrames).toBeGreaterThan(1);
    expect(resumed).toBe(true);
    engine.start();
    expect(engine.getSnapshot().stage.transition).toBeNull();
  });

  it('integrates background travel at one quarter of current wall speed', () => {
    const { engine, step } = createRuntimeEngine({ rng: () => 0.5 });
    engine.start();

    expect(engine.getSnapshot().backgroundScrollDistancePx).toBe(0);
    const snapshot = step(100);
    expect(snapshot.difficulty.scrollSpeed).toBe(240);
    expect(snapshot.backgroundScrollDistancePx).toBeCloseTo(6);
  });

  it('swaps stages under opaque portal cover after a boss clear and gives the next boss its stage identity', () => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 60, initialCompletedWarningCount: 1,
      rng: () => 0.5, stageRng: () => 0.5,
    });
    engine.setInvincibilityEnabled(true);
    engine.start();
    for (let frame = 0; frame < 15; frame += 1) step();
    const initial = engine.getSnapshot();
    const nextStageId = initial.stage.order[1];
    expect(initial.warning.index).toBe(2);
    expect(initial.specialTimingGuideActive).toBe(true);
    let snapshot = initial;
    let cleared = false;
    let resumed = false;
    let nextBoss = false;
    let bossWavesCompleted = 0;
    const specialCounts = [];
    const artOwners = new Map();
    const phases = new Set();
    let approachSeconds = 0;
    let opacityStart = null;
    let postClearScore = null;
    let swapped = false;

    for (let frame = 0; frame < 12000 && !nextBoss; frame += 1) {
      const before = snapshot;
      if (before.boss) expect(before.boss.stageId).toBe(before.stage.id);
      if (before.boss?.attack?.type === 'volley') expect(before.boss.attack.stageId).toBe(before.stage.id);
      if (before.challenge?.active) {
        for (const code of before.challenge.sequence.slice(before.challenge.cursor)) engine.handleChallengeKey(code);
      }
      for (const wall of before.obstacles) {
        if (artOwners.has(wall.id)) expect(wall.stageId).toBe(artOwners.get(wall.id));
        else artOwners.set(wall.id, wall.stageId);
      }
      const milliseconds = before.stage.transition ? 10 : 100;
      snapshot = step(milliseconds);
      const delta = milliseconds / 1000;
      // Existing artwork keeps its owner until it physically exits the world.
      // Passing the player or changing scenery must never silently remove/relabel it.
      for (const wall of before.obstacles) {
        const retained = snapshot.obstacles.find((candidate) => candidate.id === wall.id);
        if (retained) expect(retained.stageId).toBe(wall.stageId);
        else expect(wall.x + wall.width - snapshot.difficulty.scrollSpeed * delta).toBeLessThan(0);
      }
      if (before.boss && !snapshot.boss) {
        cleared = true;
        postClearScore = snapshot.score;
        expect(snapshot.score - before.score).toBe(10);
        expect(snapshot.progressionScore - before.progressionScore).toBe(10);
        expect(snapshot.difficulty.baseSpeed).toBeCloseTo(getBaseSpeed(snapshot.progressionScore));
        expect(snapshot.difficulty.baseSpeed / before.difficulty.baseSpeed).toBeCloseTo(1.1);
        expect(snapshot.speedChange).not.toBeNull();
        expect(snapshot.difficulty.movingGapChance).toBe(0.5);
        expect(snapshot.specialTimingGuideActive).toBe(false);
        expect(snapshot.stage.id).toBe(initial.stage.id);
      }
      if (before.warning?.spawnedCount === 7 && snapshot.warning?.spawnedCount === 0) bossWavesCompleted += 1;
      if (snapshot.warning?.spawnedCount === 7 && before.warning?.spawnedCount !== 7 && snapshot.warning.index === 2) {
        specialCounts.push(snapshot.warning.specialSpawnedCount);
      }
      const transition = snapshot.stage.transition;
      if (transition) {
        phases.add(transition.phase);
        expect(cleared).toBe(true);
        expect(snapshot.obstacles).toHaveLength(0);
        expect(snapshot.score).toBe(postClearScore);
        expect(snapshot.boss).toBeNull();
        expect(snapshot.bossPreview).toBeNull();
        expect(snapshot.warning).toBeNull();
        expect(transition).toMatchObject({
          kind: 'portal', fromStageId: initial.stage.id, destinationStageId: nextStageId,
          fromKey: initial.stage.bossBackgroundKey, toKey: nextStageId,
          crossingX: snapshot.player.x, crossingY: snapshot.player.y,
        });
        expect(snapshot.stage.id).toBe(transition.swapped ? nextStageId : initial.stage.id);
        if (transition.phase === 'lead-in') {
          expect(transition.travelledPixels).toBe(0);
          expect(transition.phaseElapsedSeconds).toBeLessThan(0.45);
        }
        const travelled = transition.travelledPixels - (before.stage.transition?.travelledPixels ?? 0);
        if (travelled > 0) approachSeconds += travelled / snapshot.difficulty.scrollSpeed;
        if (transition.phase === 'approach') {
          expect(transition.elapsedSeconds - transition.phaseElapsedSeconds).toBeCloseTo(0.45);
          expect(transition.portalX).toBeCloseTo(snapshot.player.x + 960 - transition.travelledPixels);
        }
        if (['white-out', 'hold', 'reveal'].includes(transition.phase)) {
          opacityStart ??= transition.elapsedSeconds - transition.phaseElapsedSeconds;
          expect(opacityStart).toBeCloseTo(0.45 + approachSeconds);
          expect(transition.travelledPixels).toBe(960);
          expect(transition.progress).toBe(1);
          expect(transition.portalX).toBe(snapshot.player.x);
          const phaseStart = transition.elapsedSeconds - transition.phaseElapsedSeconds;
          expect(phaseStart - opacityStart).toBeCloseTo({ 'white-out': 0, hold: 0.2, reveal: 0.3 }[transition.phase]);
          expect(transition.phaseElapsedSeconds).toBeLessThan({ 'white-out': 0.2, hold: 0.1, reveal: 0.6 }[transition.phase]);
        }
        if (transition.swapped && !swapped) {
          expect(transition.phase).toBe('hold');
          expect(before.stage.id).toBe(initial.stage.id);
          expect(before.stage.transition.phase).toBe('white-out');
          swapped = true;
        }
      } else if (before.stage.transition) {
        expect(before.stage.transition.phase).toBe('reveal');
        expect(before.stage.transition.phaseElapsedSeconds + delta).toBeGreaterThanOrEqual(0.6 - 1e-9);
        expect(before.stage.transition.phaseElapsedSeconds + delta).toBeLessThan(0.6 + delta);
        expect(snapshot.stage.id).toBe(nextStageId);
        expect(snapshot.obstacles).toHaveLength(1);
        expect(snapshot.obstacles[0].stageId).toBe(nextStageId);
        resumed = true;
      }
      if (resumed) {
        for (const wall of snapshot.obstacles) expect(wall.stageId).toBe(nextStageId);
        if (snapshot.boss) {
          expect(snapshot.boss.number).toBe(2);
          expect(snapshot.boss.stageId).toBe(nextStageId);
          expect(snapshot.stage.id).toBe(nextStageId);
          nextBoss = true;
        }
      }
    }
    expect(cleared).toBe(true);
    expect(bossWavesCompleted).toBeGreaterThanOrEqual(2);
    expect(specialCounts.length).toBeGreaterThanOrEqual(2);
    expect(specialCounts.every((count) => count >= 3)).toBe(true);
    expect(artOwners.size).toBeGreaterThan(0);
    expect([...phases]).toEqual(['lead-in', 'approach', 'white-out', 'hold', 'reveal']);
    expect(swapped).toBe(true);
    expect(resumed).toBe(true);
    expect(nextBoss).toBe(true);
    engine.start();
    const restarted = engine.getSnapshot();
    expect(restarted.stage.id).toBe(initial.stage.id);
    expect(restarted.stage.index).toBe(0);
    expect(restarted.stage.transition).toBeNull();
    expect(restarted.obstacles).toHaveLength(0);
    expect(restarted.difficulty.movingGapChance).toBe(0);
    expect(restarted.specialTimingGuideActive).toBe(true);
    for (let frame = 0; frame < 15; frame += 1) snapshot = step();
    expect(snapshot.stage.id).toBe(initial.stage.id);
    expect(snapshot.stage.transition).toBeNull();
    expect(snapshot.boss.stageId).toBe(initial.stage.id);
  });

  it('uses the boss atmosphere variant while a boss warning is active', () => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 60,
      initialCompletedWarningCount: 1,
      stageRng: () => 0,
    });
    engine.start();
    for (let frame = 0; frame < 15; frame += 1) step(100);

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
    const { engine, step } = createRuntimeEngine({ aircraftId: 'aegis', accountBestScore: 50, gravity: 900 });
    engine.start();
    const initial = engine.getSnapshot();

    expect(initial.aircraft).toMatchObject({ id: 'aegis', gravityMultiplier: 1.3, liftMultiplier: 0.7 });
    expect(initial.player).toMatchObject({ width: 36, height: 24 });
    const falling = step();
    expect(falling.player.velocityY).toBeCloseTo(117);
    expect(falling.player.y).toBeCloseTo(281.7);
    engine.lift();
    expect(engine.getSnapshot().player.velocityY).toBeCloseTo(-252, 10);
    step();
    expect(engine.getSnapshot().player.width).toBe(36);
  });

  it('uses VELOCITY movement and score multipliers only when unlocked', () => {
    const { engine, step } = createRuntimeEngine({ aircraftId: 'velocity', accountBestScore: 100 });
    expect(engine.setAircraft('velocity')).toBe('velocity');
    engine.start();
    const snapshot = step();

    expect(snapshot.aircraft).toMatchObject({ id: 'velocity', scoreMultiplier: 1.5 });
    expect(snapshot).toMatchObject({ baseScore: 0, finalScore: 0, scoreMultiplier: 1.5 });
    expect(snapshot.difficulty).toMatchObject({ scrollSpeed: 480, aircraftSpawnIntervalMultiplier: 0.5 });
    expect(snapshot.obstacles.length).toBeGreaterThanOrEqual(1);
  });

  it('caps VELOCITY fast-BOSS movement at 2.2x while preserving other profiles', () => {
    const enterBoss = (aircraftId, rngValue) => {
      const { engine, step } = createRuntimeEngine({
        aircraftId,
        accountBestScore: 100,
        initialScore: 60,
        initialCompletedWarningCount: 1,
        rng: () => rngValue,
      });
      engine.setInvincibilityEnabled(true);
      engine.start();
      let snapshot = engine.getSnapshot();
      for (let frame = 0; frame < 30 && !snapshot.difficulty.isBoss; frame += 1) snapshot = step(100);
      return { engine, step, snapshot };
    };

    const velocityFast = enterBoss('velocity', 0.4).snapshot;
    expect(velocityFast.difficulty).toMatchObject({
      bossPattern: 'fast', speedMultiplier: 1.25, speedAdjustmentMultiplier: 0.88,
    });
    expect(velocityFast.difficulty.targetScrollSpeed / velocityFast.difficulty.baseSpeed).toBeCloseTo(2.2);
    expect(velocityFast.difficulty.scrollSpeed).toBeLessThan(velocityFast.difficulty.targetScrollSpeed);

    const defaultFast = enterBoss('default', 0.4).snapshot;
    expect(defaultFast.difficulty.targetScrollSpeed / defaultFast.difficulty.baseSpeed).toBeCloseTo(1.25);

    const velocitySlow = enterBoss('velocity', 0).snapshot;
    expect(velocitySlow.difficulty.bossPattern).toBe('slow');
    expect(velocitySlow.difficulty.targetScrollSpeed / velocitySlow.difficulty.baseSpeed).toBeCloseTo(1.5);

    const shift = enterBoss('velocity', 0.67);
    expect(shift.snapshot.difficulty.bossPattern).toBe('shift');
    for (let frame = 0; frame < 30 && shift.snapshot.elapsedSeconds - shift.snapshot.boss.bossStartElapsedSeconds < 2.2
      && shift.snapshot.state === GAME_STATES.PLAYING; frame += 1) {
      shift.snapshot = shift.step(100);
    }
    expect(shift.snapshot.elapsedSeconds - shift.snapshot.boss.bossStartElapsedSeconds).toBeGreaterThanOrEqual(2.2);
    expect(shift.snapshot.difficulty.speedMultiplier).toBe(1.25);
    expect(shift.snapshot.difficulty.targetScrollSpeed / shift.snapshot.difficulty.baseSpeed).toBeCloseTo(2.2);
  });

  it('keeps boss speed and both scores fixed while boss walls and failed challenges continue', () => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 60,
      initialCompletedWarningCount: 1,
      rng: () => 0.5,
    });
    engine.setInvincibilityEnabled(true);
    engine.start();
    let snapshot = engine.getSnapshot();
    const passedBossWalls = new Set();
    for (let frame = 0; frame < 500; frame += 1) {
      snapshot = step(100);
      for (const wall of snapshot.obstacles) {
        if (wall.passed && wall.warningIndex === 2) passedBossWalls.add(wall.id);
      }
    }

    expect(passedBossWalls.size).toBeGreaterThan(10);
    expect(snapshot.score).toBe(60);
    expect(snapshot.progressionScore).toBe(60);
    const entryBaseSpeed = getBaseSpeed(60);
    expect(snapshot.boss?.baseScrollSpeed).toBeCloseTo(entryBaseSpeed);
    expect(snapshot.difficulty.baseSpeed).toBeCloseTo(entryBaseSpeed);
    expect(snapshot.difficulty.targetScrollSpeed).toBeCloseTo(entryBaseSpeed * 1.25);
  });

  it('eases score-step acceleration over two seconds with gentle starts and stops', () => {
    const { engine, step } = createRuntimeEngine({ initialScore: 9, rng: () => 0.5 });
    engine.setInvincibilityEnabled(true);
    engine.start();
    let snapshot = engine.getSnapshot();

    for (let frame = 0; frame < 500 && snapshot.progressionScore < 10; frame += 1) {
      snapshot = step(100);
    }
    expect(snapshot.progressionScore).toBeGreaterThanOrEqual(10);
    expect(snapshot.difficulty.targetScrollSpeed).toBeCloseTo(264);
    expect(snapshot.difficulty.scrollSpeed).toBeCloseTo(240);
    expect(snapshot.speedChange).toMatchObject({ direction: 'up' });

    const speeds = [snapshot.difficulty.scrollSpeed];
    for (let quarter = 0; quarter < 4; quarter += 1) {
      for (let frame = 0; frame < 5; frame += 1) snapshot = step(100);
      speeds.push(snapshot.difficulty.scrollSpeed);
      if (quarter === 1) {
        expect(snapshot.difficulty.scrollSpeed).toBeCloseTo(252);
        expect(snapshot.speedChange).toMatchObject({ direction: 'up', remainingSeconds: 1 });
      }
    }
    expect(speeds.every((speed, index) => index === 0 || speed > speeds[index - 1])).toBe(true);
    expect(speeds[1] - speeds[0]).toBeLessThan(speeds[2] - speeds[1]);
    expect(speeds[4] - speeds[3]).toBeLessThan(speeds[3] - speeds[2]);
    expect(snapshot.difficulty.scrollSpeed).toBeCloseTo(264);
    expect(snapshot.speedChange).toBeNull();
  });

  it.each([
    { pattern: 'slow', rngValue: 0, direction: 'down', multiplier: 0.75 },
    { pattern: 'fast', rngValue: 0.4, direction: 'up', multiplier: 1.25 },
  ])('eases $pattern boss entry without an abrupt speed change', ({ rngValue, direction, multiplier }) => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 60, initialCompletedWarningCount: 1, rng: () => rngValue,
    });
    engine.setInvincibilityEnabled(true);
    engine.start();
    let snapshot = engine.getSnapshot();
    const baseSpeed = snapshot.difficulty.scrollSpeed;
    for (let frame = 0; frame < 30 && !snapshot.boss; frame += 1) snapshot = step(100);
    expect(snapshot.boss).not.toBeNull();
    const targetSpeed = baseSpeed * multiplier;
    const fullChange = Math.abs(targetSpeed - baseSpeed);
    expect(snapshot.speedChange?.direction).toBe(direction);
    expect(Math.abs(snapshot.difficulty.scrollSpeed - baseSpeed)).toBeLessThan(fullChange * 0.02);

    for (let frame = 0; frame < 5; frame += 1) snapshot = step(100);
    expect(snapshot.speedChange?.direction).toBe(direction);
    expect(snapshot.difficulty.scrollSpeed).toBeGreaterThan(Math.min(baseSpeed, targetSpeed));
    expect(snapshot.difficulty.scrollSpeed).toBeLessThan(Math.max(baseSpeed, targetSpeed));
    for (let frame = 0; frame < 14; frame += 1) snapshot = step(100);
    expect(snapshot.difficulty.scrollSpeed).toBeCloseTo(targetSpeed);
    expect(snapshot.speedChange).toBeNull();
  });

  it('retargets shifting boss speed from the current speed without snapping', () => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 60, initialCompletedWarningCount: 1, rng: () => 0.8,
    });
    engine.setInvincibilityEnabled(true);
    engine.start();
    let snapshot = engine.getSnapshot();
    for (let frame = 0; frame < 30 && !snapshot.boss; frame += 1) snapshot = step(100);
    expect(snapshot.boss).not.toBeNull();
    let before;
    for (let frame = 0; frame < 30 && snapshot.difficulty.speedMultiplier !== 1.25; frame += 1) {
      before = snapshot;
      snapshot = step(100);
    }

    expect(snapshot.difficulty.speedMultiplier).toBe(1.25);
    expect(snapshot.speedChange?.direction).toBe('up');
    expect(Math.abs(snapshot.difficulty.scrollSpeed - before.difficulty.scrollSpeed))
      .toBeLessThan(before.difficulty.baseSpeed * 0.01);
    expect(snapshot.difficulty.scrollSpeed).toBeLessThan(snapshot.difficulty.targetScrollSpeed);
  });

  it('rejects locked aircraft and changing aircraft during an active run', () => {
    const engine = createGameEngine({ now: () => 1000, accountBestScore: 0 });

    expect(engine.setAircraft('aegis')).toBe(false);
    expect(engine.setAircraft('unknown')).toBe('default');
    engine.start();
    expect(engine.setAircraft('default')).toBe(false);
  });

  it('allows every catalog aircraft in guest mode but restores account unlock rules on sign-in', () => {
    const engine = createGameEngine({ now: () => 1000, accountBestScore: 0 });
    engine.setGuestMode(true);
    expect(engine.setAircraft('aegis')).toBe('aegis');
    expect(engine.setAircraft('velocity')).toBe('velocity');

    engine.setGuestMode(false);
    expect(engine.setAircraft('velocity')).toBe(false);
    expect(engine.setAircraft('aegis')).toBe(false);
    expect(engine.setAircraft('default')).toBe('default');
  });

  it('freezes guest mode and selected aircraft through play and pause', () => {
    const { engine } = createRuntimeEngine({ accountBestScore: 0 });
    engine.setGuestMode(true);
    expect(engine.setAircraft('velocity')).toBe('velocity');
    engine.start();

    expect(engine.setGuestMode(false)).toBe(true);
    expect(engine.setAircraft('default')).toBe(false);
    expect(engine.getSnapshot()).toMatchObject({ aircraft: { id: 'velocity' } });

    engine.pause();
    expect(engine.setGuestMode(false)).toBe(true);
    expect(engine.getSnapshot()).toMatchObject({ state: GAME_STATES.PAUSED, aircraft: { id: 'velocity' } });
  });

  it('freezes account mode and aircraft through play and pause', () => {
    const { engine } = createRuntimeEngine({ accountBestScore: 100 });
    expect(engine.setAircraft('velocity')).toBe('velocity');
    engine.start();

    expect(engine.setGuestMode(true)).toBe(false);
    expect(engine.getSnapshot()).toMatchObject({ aircraft: { id: 'velocity' } });

    engine.pause();
    expect(engine.setGuestMode(true)).toBe(false);
    expect(engine.getSnapshot()).toMatchObject({ state: GAME_STATES.PAUSED, aircraft: { id: 'velocity' } });
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

  it('runs the second WARNING as a boss segment with seven walls and three specials', () => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 60,
      initialCompletedWarningCount: 1,
    });
    engine.start();
    for (let frame = 0; frame < 15; frame += 1) step(100);
    const initial = engine.getSnapshot();
    expect(initial.difficulty).toMatchObject({ isWarning: true, isBoss: true, bossPattern: 'fast' });
    expect(initial.warning).toMatchObject({ index: 2, targetCount: 7, requiredSpecials: 3 });
    expect(initial.obstacles.filter(({ kind }) => kind === 'special').every(({ showTimingGuide }) => showTimingGuide)).toBe(true);

    let snapshot;
    let completedSegmentSnapshot;
    for (let frame = 0; frame < 120; frame += 1) {
      const activeTarget = engine.getSnapshot().obstacles
        .find((obstacle) => obstacle.kind === 'special' && obstacle.x >= 240);
      if (!engine.getSnapshot().player.isDashing && activeTarget && activeTarget.x - 240 <= 100) {
        engine.dash();
      }
      snapshot = step();
      if (snapshot.warning?.index === 2 && snapshot.warning.spawnedCount === 7) {
        completedSegmentSnapshot = snapshot;
      }
    }
    expect(completedSegmentSnapshot ?? initial).toBeDefined();
  });

  it.each([
    ['wrong key', true],
    ['timeout', false],
  ])('retries after a challenge %s without granting damage or score', (_label, enterWrongKey) => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 60,
      initialCompletedWarningCount: 1,
      rng: () => 0.4,
    });
    engine.setInvincibilityEnabled(true);
    engine.start();
    let snapshot = engine.getSnapshot();
    for (let frame = 0; frame < 1000 && !snapshot.challenge?.active; frame += 1) snapshot = step(100);
    expect(snapshot.challenge?.active).toBe(true);
    expect(snapshot.warning.remainingSpecials).toBe(0);
    expect(snapshot.boss.attack).toBeNull();
    const frozen = snapshot;
    snapshot = step(100);
    expect(snapshot.elapsedSeconds).toBe(frozen.elapsedSeconds);
    expect(snapshot.backgroundScrollDistancePx).toBe(frozen.backgroundScrollDistancePx);
    expect(snapshot.player).toEqual(frozen.player);
    expect(snapshot.obstacles).toEqual(frozen.obstacles);
    expect(snapshot.challenge.remainingSeconds).toBeLessThan(frozen.challenge.remainingSeconds);
    expect(engine.dash()).toBe(false);
    expect(engine.lift()).toBe(false);

    if (enterWrongKey) {
      const wrong = ['KeyW', 'KeyA', 'KeyS', 'KeyD'].find((key) => key !== snapshot.challenge.sequence[0]);
      engine.handleChallengeKey(wrong);
      snapshot = engine.getSnapshot();
    } else {
      for (let frame = 0; frame < 50 && snapshot.challenge.active; frame += 1) snapshot = step(100);
    }
    expect(snapshot.challenge).toMatchObject({ active: false, result: 'failure', resolved: true });
    expect(snapshot.boss).toMatchObject({ hp: 3, challengeCount: 1, successfulChallenges: 0, wallSpawningPaused: false });
    expect(snapshot.feedbackEffect.remainingSeconds).toBeCloseTo(4);
    expect(snapshot.score).toBe(60);
    expect(snapshot.progressionScore).toBe(60);
    for (let frame = 0; frame < 1000 && !snapshot.challenge.active; frame += 1) snapshot = step(100);
    expect(snapshot.challenge.active).toBe(true);
    for (const code of snapshot.challenge.sequence) engine.handleChallengeKey(code);
    expect(engine.getSnapshot().boss.counterattack).not.toBeNull();
    for (let frame = 0; frame < 3; frame += 1) step(100);
    expect(engine.getSnapshot().boss).toMatchObject({ hp: 2, challengeCount: 2, successfulChallenges: 1 });
    expect(engine.handleChallengeKey('KeyW')).toBe(false);
    step(100);
    expect(engine.getSnapshot().boss.successfulChallenges).toBe(1);
  });

  it('clears a late boss with exactly three challenges and awards its only ten points once', () => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 120, initialCompletedWarningCount: 9, rng: () => 0.5,
    });
    engine.setInvincibilityEnabled(true);
    engine.start();
    let successes = 0;
    let enteredBoss = false;
    let entryScore;
    let snapshot = engine.getSnapshot();
    for (let frame = 0; frame < 2000; frame += 1) {
      if (snapshot.boss) {
        enteredBoss = true;
        entryScore ??= snapshot.score;
        expect(snapshot.boss.attack?.type).not.toBe('projectile');
        expect(snapshot.score).toBe(entryScore);
        expect(snapshot.progressionScore).toBe(entryScore);
        if (snapshot.challenge?.active) {
          expect(snapshot.challenge.timeLimitSeconds).toBe(snapshot.boss.number === 1 ? 5 : 2.8);
          expect(snapshot.challenge.sequence.length).toBeGreaterThanOrEqual(6);
          for (const code of snapshot.challenge.sequence) engine.handleChallengeKey(code);
          successes += 1;
        }
      }
      snapshot = step(100);
      if (enteredBoss && !snapshot.boss) break;
    }
    expect(enteredBoss).toBe(true);
    expect(successes).toBe(3);
    expect(snapshot.boss).toBeNull();
    expect(snapshot.score).toBe(entryScore + 10);
    expect(snapshot.progressionScore).toBe(entryScore + 10);
    snapshot = step(100);
    expect(snapshot.score).toBe(entryScore + 10);
    expect(snapshot.progressionScore).toBe(entryScore + 10);
  });

  it('runs single lasers and a stage signature before the required challenge', () => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 60, initialCompletedWarningCount: 3, rng: () => 0.6,
    });
    engine.setInvincibilityEnabled(true);
    engine.start();
    const lasers = new Set();
    let concurrent = false;
    let signatureSeen = false;
    let snapshot = engine.getSnapshot();
    for (let frame = 0; frame < 1000 && !snapshot.challenge?.active; frame += 1) {
      snapshot = step(100);
      const attack = snapshot.boss?.attack;
      if (attack?.type === 'volley') signatureSeen = true;
      if (attack?.type === 'laser') {
        expect(attack.type).toBe('laser');
        expect(snapshot.challenge?.active).not.toBe(true);
        lasers.add(attack.id);
        if (snapshot.obstacles.some((wall) => wall.kind === 'normal' && !wall.passed)) concurrent = true;
        for (const wall of snapshot.obstacles.filter((wall) => wall.kind === 'normal' && attack.kind === 'single')) {
          expect(isLaserPathSafe(attack.y, wall)).toBe(true);
        }
      }
    }
    expect(lasers.size).toBeGreaterThanOrEqual(1);
    expect(signatureSeen).toBe(true);
    expect(concurrent).toBe(true);
    expect(snapshot.boss.number).toBe(2);
    expect(snapshot.challenge?.active).toBe(true);
    expect(snapshot.boss.successfulChallenges).toBe(0);
    expect(snapshot.warning.remainingSpecials).toBe(0);
  });

  it('keeps quarter warnings, firing and fade wall-free across seeded boss waves', () => {
    let quarterFrames = 0;
    let clearedBosses = 0;
    for (let seed = 1; seed <= 20; seed += 1) {
      let value = seed;
      const rng = () => { value = (Math.imul(1664525, value) + 1013904223) >>> 0; return value / 4294967296; };
      const { engine, step } = createRuntimeEngine({
        initialScore: 60, initialCompletedWarningCount: 3, rng,
      });
      engine.setInvincibilityEnabled(true);
      engine.start();
      let snapshot = engine.getSnapshot();
      let enteredBoss = false;
      for (let frame = 0; frame < 1800; frame += 1) {
        snapshot = step();
        if (snapshot.boss) enteredBoss = true;
        if (snapshot.boss?.attack?.kind === 'quarter') {
          quarterFrames += 1;
          expect(snapshot.obstacles).toHaveLength(0);
          expect(snapshot.boss.wallSpawningPaused).toBe(true);
          expect(snapshot.boss.attack.telegraphDurationSeconds).toBe(2);
        } else if (snapshot.boss?.attack?.kind === 'single') {
          expect(snapshot.boss.wallSpawningPaused).toBe(true);
          for (const wall of snapshot.obstacles.filter((item) => item.kind === 'normal')) {
            expect(isLaserPathSafe(snapshot.boss.attack.y, wall)).toBe(true);
          }
        }
        if (snapshot.challenge?.active) {
          for (const code of snapshot.challenge.sequence) engine.handleChallengeKey(code);
        }
        if (enteredBoss && !snapshot.boss) { clearedBosses += 1; break; }
      }
    }
    expect(quarterFrames).toBeGreaterThan(0);
    expect(clearedBosses).toBe(20);
  });

  it('guarantees two normal walls per boss wave even when every random roll prefers special', () => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 100,
      initialCompletedWarningCount: 5,
      rng: () => 0.4,
    });
    engine.setInvincibilityEnabled(true);
    engine.start();
    let snapshot = engine.getSnapshot();

    for (let frame = 0; frame < 160
      && (!snapshot.warning || snapshot.warning.spawnedCount < snapshot.warning.targetCount); frame += 1) {
      snapshot = step(100);
    }

    expect(snapshot.warning).toMatchObject({ index: 6, spawnedCount: 7, targetCount: 7 });
    expect(snapshot.warning.specialSpawnedCount).toBeGreaterThanOrEqual(3);
    expect(snapshot.warning.spawnedCount - snapshot.warning.specialSpawnedCount).toBeGreaterThanOrEqual(2);
  });

  it('keeps flight live during roar, then freezes only WASD with its entire countdown', () => {
    const { engine, step } = createRuntimeEngine({ initialScore: 60, initialCompletedWarningCount: 1, rng: () => .4 });
    engine.setInvincibilityEnabled(true); engine.start();
    let snapshot = engine.getSnapshot();
    for (let i = 0; i < 1000 && !snapshot.boss?.roar; i++) snapshot = step();
    expect(snapshot.boss?.roar).not.toBeNull();
    const beforeRoar = snapshot;
    for (let i = 0; i < 7; i++) snapshot = step();
    expect(snapshot.boss.roar.elapsedSeconds).toBeCloseTo(.7);
    expect(snapshot.elapsedSeconds).toBeCloseTo(beforeRoar.elapsedSeconds + .7);
    expect(snapshot.backgroundScrollDistancePx).toBeGreaterThan(beforeRoar.backgroundScrollDistancePx);
    expect(engine.lift()).toBe(true); expect(engine.dash()).toBe(true);
    snapshot = step();
    expect(snapshot.boss.roar).toBeNull();
    expect(snapshot.challenge).toMatchObject({ active: true, remainingSeconds: 5 });
    expect(snapshot.player.y).toBeLessThan(beforeRoar.player.y);
    const frozen = snapshot; snapshot = step();
    expect(snapshot.elapsedSeconds).toBe(frozen.elapsedSeconds);
    expect(snapshot.player).toEqual(frozen.player);
    expect(snapshot.challenge.remainingSeconds).toBeCloseTo(4.9);
    for (const code of snapshot.challenge.sequence) engine.handleChallengeKey(code);
    snapshot = engine.getSnapshot();
    expect(snapshot.boss.hp).toBe(3);
    expect(snapshot.boss.counterattack.fromX).toBe(snapshot.player.x);
    expect(snapshot.boss.counterattack.toX).toBeGreaterThan(740);
    for (let i = 0; i < 3; i++) snapshot = step();
    expect(snapshot.boss.hp).toBe(2);
    expect(snapshot.boss.hitEffect).not.toBeNull();
  });

  it('checks single lasers before a wall wave completes, starting with boss one', () => {
    // Normal selections and successful activation without depending on RNG call counts.
    const runtime = createRuntimeEngine({ initialScore: 60, initialCompletedWarningCount: 1, rng: () => .6 });
    runtime.engine.setInvincibilityEnabled(true); runtime.engine.start();
    let snapshot;
    for (let i = 0; i < 600; i++) {
      snapshot = runtime.step();
      if (snapshot.boss?.attack?.kind === 'single') break;
    }
    expect(snapshot.boss?.attack?.kind).toBe('single');
    expect(snapshot.boss.number).toBe(1);
    expect(snapshot.boss.wallSpawningPaused).toBe(true);
    // All existing normal openings remain safe throughout the shot.
    for (const wall of snapshot.obstacles.filter(w => w.kind === 'normal')) expect(isLaserPathSafe(snapshot.boss.attack.y, wall)).toBe(true);
  });

  it('gives every shot in a three-shot global sequence a new safe quarter and full warning', () => {
    let queue = [];
    const { engine, step } = createRuntimeEngine({ initialScore: 60, initialCompletedWarningCount: 3, rng: () => queue.shift() ?? .4 });
    engine.setInvincibilityEnabled(true); engine.start();
    let snapshot = engine.getSnapshot();
    const shots = new Map();
    for (let i = 0; i < 1500 && !snapshot.boss?.roar; i++) {
      if (snapshot.boss?.attack?.type === 'volley' && snapshot.boss.volleysFired === snapshot.boss.volleyBudget
        && snapshot.obstacles.length === 0) queue = [0, .99, .1, .1, .1];
      snapshot = step();
      const attack = snapshot.boss?.attack;
      if (attack?.kind === 'quarter' && !shots.has(attack.id)) {
        expect(snapshot.obstacles).toHaveLength(0);
        expect(attack.telegraphRemainingSeconds).toBe(attack.telegraphDurationSeconds);
        expect(attack.telegraphRemainingSeconds).toBeGreaterThanOrEqual(2);
        shots.set(attack.id, attack.safeZone);
      }
      if (attack?.type === 'volley') {
        const x = attack.projectiles[0].x;
        attack.projectiles[0].x = -999;
        expect(engine.getSnapshot().boss.attack.projectiles[0].x).toBe(x);
      }
    }
    const zones = [...shots.values()];
    expect(zones).toHaveLength(3);
    expect(zones[0]).not.toBe(zones[1]); expect(zones[1]).not.toBe(zones[2]);
    expect(snapshot.boss.roar).not.toBeNull();
  });

  it('unlocks hybrid barriers only after the first boss and times the recessed barrier', () => {
    const before = createRuntimeEngine({ initialScore: 60, initialCompletedWarningCount: 0, rng: () => 0.45 });
    before.engine.setInvincibilityEnabled(true);
    before.engine.start();
    let snapshot;
    for (let frame = 0; frame < 50; frame += 1) snapshot = before.step();
    expect(snapshot.obstacles.some((wall) => wall.kind === 'hybrid')).toBe(false);
    const { engine, step } = createRuntimeEngine({ initialScore: 60, initialCompletedWarningCount: 2, rng: () => 0.45 });
    engine.setInvincibilityEnabled(true);
    engine.start();
    let target;
    for (let frame = 0; frame < 80; frame += 1) {
      snapshot = engine.getSnapshot();
      target = snapshot.obstacles.find((wall) => wall.kind === 'hybrid' && !wall.passed);
      if (target && (target.x + 24 - snapshot.player.x) / snapshot.difficulty.scrollSpeed <= snapshot.difficulty.timingWindowSeconds) break;
      step();
    }
    expect(target).toBeDefined();
    engine.dash();
    snapshot = engine.getSnapshot();
    expect(snapshot.player.dashKind).toBe('special');
    expect(snapshot.obstacles.find((wall) => wall.id === target.id)).toMatchObject({ barrierBroken: true, barrierBreakY: 270 });
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

  it('spawns a moving normal wall after the first boss clear and uses the regular cycle', () => {
    const values = [0.9, 0, 0.5, 0.25, 0.5];
    const { engine, step } = createRuntimeEngine({
      initialScore: 35,
      initialCompletedWarningCount: 4,
      rng: () => values.shift() ?? 0.5,
    });
    engine.start();

    const snapshot = step();

    expect(snapshot.obstacles[0]).toMatchObject({
      kind: 'normal',
      movingGap: true,
      gapMotionCycleSeconds: 4.8,
    });
  });

  it('uses the slower moving-gap cycle for warning spawns', () => {
    let randomCall = 0;
    const { engine, step } = createRuntimeEngine({
      initialScore: 50,
      initialCompletedWarningCount: 2,
      rng: () => {
        const values = [0.9, 0.1, 0.5, 0.5];
        return values[randomCall++ % values.length];
      },
    });
    engine.start();
    const snapshot = step(100);
    const warningMovingWall = snapshot.obstacles.find((obstacle) => obstacle.warningIndex === 3);

    expect(warningMovingWall).toMatchObject({
      kind: 'normal',
      movingGap: true,
      gapMotionCycleSeconds: 3.2,
    });
  });

  it('keeps moving gaps locked before the first boss clear even at high scores', () => {
    const { engine, step } = createRuntimeEngine({ initialScore: 100, rng: () => 0.9 });
    engine.start();
    const snapshot = step(100);
    expect(snapshot.difficulty.movingGapChance).toBe(0);
    expect(snapshot.obstacles.every((wall) => !wall.movingGap)).toBe(true);
  });

  it('previews a cached boss pattern for 1.5 seconds while normal play continues', () => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 60,
      initialCompletedWarningCount: 1,
      rng: () => 0.5,
    });
    engine.start();

    const preview = engine.getSnapshot();
    expect(preview.bossPreview).toMatchObject({ warningIndex: 2, pattern: 'fast', remainingSeconds: 1.5 });
    expect(preview.warning).toBeNull();
    expect(preview.boss).toBeNull();
    expect(preview.difficulty).toMatchObject({ isWarning: false, isBoss: false, speedMultiplier: 1 });

    let duringPreview;
    for (let frame = 0; frame < 5; frame += 1) duringPreview = step(100);
    expect(duringPreview.bossPreview.remainingSeconds).toBeCloseTo(1.0);
    expect(duringPreview.elapsedSeconds).toBeCloseTo(0.5);
    expect(duringPreview.warning).toBeNull();
    expect(duringPreview.boss).toBeNull();
    expect(duringPreview.difficulty.isBoss).toBe(false);

    for (let frame = 0; frame < 10; frame += 1) step(100);
    const activated = engine.getSnapshot();
    expect(activated.bossPreview).toBeNull();
    expect(activated.warning).toMatchObject({ index: 2, targetCount: 7 });
    expect(activated.boss).not.toBeNull();
    expect(activated.difficulty).toMatchObject({ isWarning: true, isBoss: true, bossPattern: 'fast' });
  });

  it('holds new boss walls during entrance and freezes that clock while paused', () => {
    const { engine, step } = createRuntimeEngine({ initialScore: 60, initialCompletedWarningCount: 1 });
    engine.setInvincibilityEnabled(true);
    engine.start();
    let snapshot = engine.getSnapshot();
    while (!snapshot.boss) snapshot = step();
    expect(snapshot.boss.entranceRemainingSeconds).toBe(1);
    expect(snapshot.warning.spawnedCount).toBe(0);
    snapshot = step();
    const clock = snapshot.boss.entranceRemainingSeconds;
    engine.pause();
    for (let frame = 0; frame < 5; frame += 1) snapshot = step();
    expect(snapshot.boss.entranceRemainingSeconds).toBe(clock);
    engine.resume();
    while (snapshot.boss.entranceRemainingSeconds > 0) {
      expect(snapshot.warning.spawnedCount).toBe(0);
      expect(snapshot.boss.attack).toBeNull();
      snapshot = step();
    }
    for (let frame = 0; frame < 16; frame += 1) snapshot = step();
    expect(snapshot.warning.spawnedCount).toBeGreaterThan(0);
  });

  it('limits generated gap shifts by 70% of the next gap height and clamps to world bounds', () => {
    expect(constrainGapCenter(450, 135, 270)).toBeCloseTo(364.5);
    expect(constrainGapCenter(90, 135, 270)).toBeCloseTo(175.5);
    expect(constrainGapCenter(0, 135, 100)).toBe(67.5);
  });

  it('ends on a normal obstacle collision and returns detached snapshot data', () => {
    const { engine, step } = createRuntimeEngine({ rng: () => 0 });
    engine.start();
    let snapshot;
    for (let frame = 0; frame < 50 && snapshot?.state !== GAME_STATES.GAME_OVER; frame += 1) snapshot = step();

    expect(snapshot).toMatchObject({ state: GAME_STATES.GAME_OVER, gameOverReason: 'obstacle', deathEffect: expect.any(Object) });
    const copied = engine.getSnapshot();
    copied.player.y = 999;
    copied.obstacles[0].x = 999;
    expect(engine.getSnapshot().player.y).not.toBe(999);
    expect(engine.getSnapshot().obstacles[0].x).not.toBe(999);
  });

  it('freezes the run and rejects controls during the death effect before game over', () => {
    const { engine, step } = createRuntimeEngine({ initialScore: 15 });
    engine.start();
    step(100);
    engine.stop('obstacle');

    const fatal = engine.getSnapshot();
    expect(fatal).toMatchObject({
      state: GAME_STATES.PLAYING,
      score: 15,
      gameOverReason: 'obstacle',
      deathEffect: { reason: 'obstacle', elapsedSeconds: 0, durationSeconds: 0.5, aircraftId: 'default' },
    });
    expect(engine.lift()).toBe(false);
    expect(engine.dash()).toBe(false);
    expect(engine.pause()).toEqual({ score: 15 });
    engine.stop('laser');
    const copied = engine.getSnapshot();
    copied.deathEffect.elapsedSeconds = 99;

    for (let frame = 0; frame < 4; frame += 1) {
      const snapshot = step(100);
      expect(snapshot.state).toBe(GAME_STATES.PLAYING);
      expect(snapshot.score).toBe(15);
      expect(snapshot.elapsedSeconds).toBeCloseTo(0.1);
      expect(snapshot.deathEffect.reason).toBe('obstacle');
    }
    expect(engine.getSnapshot().deathEffect.elapsedSeconds).toBeCloseTo(0.4);
    expect(step(100)).toMatchObject({
      state: GAME_STATES.GAME_OVER,
      gameOverReason: 'obstacle',
      score: 15,
      deathEffect: { elapsedSeconds: 0.5 },
    });
    expect(engine.start()).toBeUndefined();
    expect(engine.getSnapshot()).toMatchObject({ state: GAME_STATES.PLAYING, deathEffect: null, gameOverReason: null });
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
    expect(whilePaused.progressionScore).toBe(15);
    expect(whilePaused.difficulty.baseSpeed).toBeCloseTo(264);
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

  it('rounds VELOCITY final score while retaining the raw score in the snapshot', () => {
    const engine = createGameEngine({ now: () => 1000, initialScore: 33, accountBestScore: 100, aircraftId: 'velocity' });
    engine.start();

    expect(engine.getSnapshot()).toMatchObject({ score: 33, baseScore: 33, scoreMultiplier: 1.5, finalScore: 50 });
  });

  it('ends the game when gravity carries the player into a boundary', () => {
    const engine = createGameEngine({ now: () => 1000, gravity: 100000 });
    engine.start();

    engine.update(1100);

    expect(engine.getSnapshot()).toMatchObject({
      state: GAME_STATES.PLAYING,
      gameOverReason: 'boundary',
      deathEffect: { reason: 'boundary', elapsedSeconds: 0 },
    });
    for (let frame = 0; frame < 5; frame += 1) engine.update(1200 + frame * 100);
    expect(engine.getSnapshot().state).toBe(GAME_STATES.GAME_OVER);
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

  it('records, scrolls, expires, and resets a detached flight path trail', () => {
    const { engine, step } = createRuntimeEngine();
    engine.start();
    expect(engine.getSnapshot().flightTrail).toEqual([]);

    step(100);
    const first = engine.getSnapshot();
    expect(first.flightTrail).toHaveLength(1);
    step(100);
    const second = engine.getSnapshot();
    expect(second.flightTrail).toHaveLength(2);
    expect(second.flightTrail[0].x).toBeLessThan(first.flightTrail[0].x);
    second.flightTrail[0].x = 999;
    expect(engine.getSnapshot().flightTrail[0].x).not.toBe(999);

    for (let frame = 0; frame < 13; frame += 1) step(100);
    expect(engine.getSnapshot().flightTrail.every(({ ageSeconds }) => ageSeconds <= 1.2)).toBe(true);
    engine.start();
    expect(engine.getSnapshot().flightTrail).toEqual([]);
  });
});

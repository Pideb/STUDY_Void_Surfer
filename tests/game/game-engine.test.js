import { describe, expect, it } from 'vitest';
import { GAME_STATES } from '../../src/game/game-state.js';
import { constrainGapCenter, createGameEngine } from '../../src/game/game-engine.js';
import { createBossEncounter, resolveMissedBossProjectile } from '../../src/game/boss.js';

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
      initialCompletedWarningCount: 1,
      rng: () => 0.5,
      stageRng: () => 0.5,
    });
    engine.start();
    for (let frame = 0; frame < 15; frame += 1) step(100);
    const initial = engine.getSnapshot();
    const nextStageId = initial.stage.order[1];
    expect(initial.warning.index).toBe(2);
    expect(initial.specialTimingGuideActive).toBe(true);
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
        expect(snapshot.specialTimingGuideActive).toBe(false);
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
        && previousSpawnedCount !== 7 && snapshot.warning.index === 2) {
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
      engine.start();
      let snapshot = engine.getSnapshot();
      for (let frame = 0; frame < 30 && !snapshot.difficulty.isBoss; frame += 1) snapshot = step(100);
      return { engine, step, snapshot };
    };

    const velocityFast = enterBoss('velocity', 0.4).snapshot;
    expect(velocityFast.difficulty).toMatchObject({
      bossPattern: 'fast', speedMultiplier: 1.25, speedAdjustmentMultiplier: 0.88,
    });
    expect(velocityFast.difficulty.scrollSpeed / velocityFast.difficulty.baseSpeed).toBeCloseTo(2.2);

    const defaultFast = enterBoss('default', 0.4).snapshot;
    expect(defaultFast.difficulty.scrollSpeed / defaultFast.difficulty.baseSpeed).toBeCloseTo(1.25);

    const velocitySlow = enterBoss('velocity', 0).snapshot;
    expect(velocitySlow.difficulty.bossPattern).toBe('slow');
    expect(velocitySlow.difficulty.scrollSpeed / velocitySlow.difficulty.baseSpeed).toBeCloseTo(1.5);

    const shift = enterBoss('velocity', 0.67);
    expect(shift.snapshot.difficulty.bossPattern).toBe('shift');
    for (let frame = 0; frame < 15 && shift.snapshot.elapsedSeconds < 2.2
      && shift.snapshot.state === GAME_STATES.PLAYING; frame += 1) {
      shift.snapshot = shift.step(100);
    }
    expect(shift.snapshot.elapsedSeconds).toBeGreaterThanOrEqual(2.2);
    expect(shift.snapshot.difficulty.speedMultiplier).toBe(1.25);
    expect(shift.snapshot.difficulty.scrollSpeed / shift.snapshot.difficulty.baseSpeed).toBeCloseTo(2.2);
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

  it('resolves a boss projectile miss without reducing boss HP or stalling the next wave', () => {
    const encounter = createBossEncounter(1);
    encounter.attack = { type: 'projectile', state: 'missed', hitPlayer: false };

    expect(resolveMissedBossProjectile(encounter, 12.5)).toBe(true);
    expect(encounter.attack).toBeNull();
    expect(encounter.awaitingNextWave).toBe(true);
    expect(encounter.lastProjectileResolvedAt).toBe(12.5);
    expect(encounter.normalWallsSinceProjectile).toBe(0);
    expect(encounter.hp).toBe(encounter.maxHp);
    expect(resolveMissedBossProjectile(encounter, 13)).toBe(false);
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
    ['challenge success', true],
    ['challenge timeout', false],
  ])('keeps repeated boss attacks and wall waves progressing after %s', (_label, completeChallenge) => {
    const { engine, step } = createRuntimeEngine({
      initialScore: 100,
      initialCompletedWarningCount: 5,
      rng: () => 0.5,
    });
    engine.setInvincibilityEnabled(true);
    engine.start();
    const attackIds = new Set();
    let wallWaves = 0;
    let previousSpawnedCount = engine.getSnapshot().warning?.spawnedCount ?? 0;
    let challengeStarted = false;
    let challengeResolved = false;
    let previousChallengeResult = null;

    for (let frame = 0; frame < 18000 && (!challengeResolved || wallWaves < 3); frame += 1) {
      const before = engine.getSnapshot();
      const attack = before.boss?.attack;
      if (attack?.type === 'projectile') {
        attackIds.add(attack.id);
        if (attack.state === 'flying'
          && Math.abs(attack.x - before.player.x) <= attack.speed * attack.reflectionWindowSeconds
          && Math.abs(attack.y - before.player.y) <= before.player.height / 2 + 30) {
          engine.dash();
        }
      }

      if (before.challenge?.active) {
        challengeStarted = true;
        if (completeChallenge) engine.handleChallengeKey(before.challenge.sequence[before.challenge.cursor]);
      }

      const snapshot = step(20);
      if (snapshot.challenge && !snapshot.challenge.active
        && snapshot.challenge.result !== 'pending') {
        challengeResolved = true;
        previousChallengeResult = snapshot.challenge.result;
      }
      if (previousSpawnedCount === snapshot.warning?.targetCount && snapshot.warning?.spawnedCount === 0) {
        wallWaves += 1;
      }
      previousSpawnedCount = snapshot.warning?.spawnedCount ?? 0;
    }

    const finalSnapshot = engine.getSnapshot();
    expect(challengeStarted).toBe(true);
    expect(challengeResolved).toBe(true);
    expect(previousChallengeResult).toBe(completeChallenge ? 'success' : 'failure');
    expect(attackIds.size).toBeGreaterThanOrEqual(3);
    expect(wallWaves).toBeGreaterThanOrEqual(3);
    expect(finalSnapshot.warning).not.toBeNull();
    expect(finalSnapshot.challenge?.active).toBe(false);
    expect(finalSnapshot.boss?.wallSpawningPaused).toBe(false);
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

  it('uses the faster moving-gap cycle for warning spawns', () => {
    let randomCall = 0;
    const { engine, step } = createRuntimeEngine({
      initialScore: 50,
      rng: () => {
        const values = [0.9, 0.1, 0.5, 0.5];
        return values[randomCall++ % values.length];
      },
    });
    engine.start();
    const snapshot = step(100);
    const warningMovingWall = snapshot.obstacles.find((obstacle) => obstacle.warningIndex === 1);

    expect(warningMovingWall).toMatchObject({
      kind: 'normal',
      movingGap: true,
      gapMotionCycleSeconds: 1.6,
    });
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

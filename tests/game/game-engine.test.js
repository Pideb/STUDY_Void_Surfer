import { describe, expect, it } from 'vitest';
import { GAME_STATES } from '../../src/game/game-state.js';
import { createGameEngine } from '../../src/game/game-engine.js';

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

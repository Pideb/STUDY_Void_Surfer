import { describe, it, expect } from 'vitest';
import { createGameEngine } from '../../src/game/game-engine.js';
import { getDashBarrierBounds } from '../../src/game/obstacles.js';
import { getPlayerBounds, getSpecialSuccessBounds } from '../../src/game/player-geometry.js';

describe('separate central damage and aircraft-sized activation', () => {
  it.each(['default', 'aegis', 'velocity'])('%s activates before its center reaches the band without changing artwork', aircraftId => {
    let clock = 0;
    const engine = createGameEngine({ now: () => clock, gravity: 0, rng: () => 0, initialScore: 10, aircraftId, guestMode: true });
    engine.start(); let s, wall;
    for (let i = 0; i < 5000; i++) {
      clock += 1; engine.update(clock); s = engine.getSnapshot(); wall = s.obstacles[0];
      if (wall && getDashBarrierBounds(wall).x <= getSpecialSuccessBounds(s.player).right + s.difficulty.scrollSpeed * s.difficulty.timingWindowSeconds) break;
    }
    expect(s.deathEffect).toBeNull(); expect(wall.kind).toBe('special');
    const barrier = getDashBarrierBounds(wall);
    expect(barrier.x - s.player.x).toBeGreaterThan(s.difficulty.scrollSpeed * s.difficulty.timingWindowSeconds);
    expect(engine.dash()).toBe(true);
    const after = engine.getSnapshot(); expect(after.player.dashTargetId).toBe(wall.id);
    expect(after.player).toMatchObject({ width: 36, height: 24 });
    expect(getPlayerBounds(after.player)).toEqual({ left: 232, right: 248, top: 262, bottom: 278 });
    expect(getSpecialSuccessBounds(after.player)).toEqual({ left: 212, right: 268, top: 252, bottom: 288 });
    expect(engine.dash()).toBe(false);
  });
});

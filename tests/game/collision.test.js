import { describe, expect, it } from 'vitest';
import { createPlayer } from '../../src/game/player.js';
import { createObstacle } from '../../src/game/obstacles.js';
import {
  advanceDash,
  intersectsPlayerObstacle,
  isSpecialTimingSuccess,
  startDash,
} from '../../src/game/collision.js';

function makeObstacle(overrides = {}) {
  return createObstacle({
    id: 'wall-1',
    x: 220,
    gapCenter: 270,
    gapHeight: 180,
    ...overrides,
  });
}

describe('collision', () => {
  it('allows a player inside the gap and rejects a player in the top solid', () => {
    const player = createPlayer();
    const obstacle = makeObstacle();

    expect(intersectsPlayerObstacle(player, obstacle)).toBe(false);
    player.y = 80;
    expect(intersectsPlayerObstacle(player, obstacle)).toBe(true);
  });

  it('ignores the targeted special wall during a dash but not a normal wall', () => {
    const player = createPlayer();
    player.y = 80;
    const specialWall = makeObstacle({ kind: 'special' });
    const normalWall = makeObstacle({ id: 'wall-2' });

    startDash(player, 0.6, 'wall-1');
    expect(intersectsPlayerObstacle(player, specialWall)).toBe(false);
    expect(intersectsPlayerObstacle(player, normalWall)).toBe(true);

    advanceDash(player, 0.6);
    expect(player.isDashing).toBe(false);
    expect(intersectsPlayerObstacle(player, specialWall)).toBe(true);
  });

  it('accepts the timing boundary and rejects an input outside the window', () => {
    expect(isSpecialTimingSuccess({
      playerX: 240,
      wallX: 360,
      speed: 240,
      inputTime: 0.75,
      windowSeconds: 0.25,
    })).toBe(true);
    expect(isSpecialTimingSuccess({
      playerX: 240,
      wallX: 360,
      speed: 240,
      inputTime: 1.01,
      windowSeconds: 0.25,
    })).toBe(false);
  });
});

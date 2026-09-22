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

  it('requires a dash for a special wall and ignores only the targeted wall', () => {
    const player = createPlayer();
    const specialWall = makeObstacle({ kind: 'special' });
    const normalWall = makeObstacle({ id: 'wall-2' });

    expect(intersectsPlayerObstacle(player, specialWall)).toBe(true);
    startDash(player, 0.6, 'wall-1', 'special');
    expect(intersectsPlayerObstacle(player, specialWall)).toBe(false);
    player.y = 80;
    expect(intersectsPlayerObstacle(player, normalWall)).toBe(true);

    advanceDash(player, 0.6);
    expect(player.isDashing).toBe(false);
    expect(intersectsPlayerObstacle(player, specialWall)).toBe(true);
  });

  it('keeps normal dashes collidable with every wall', () => {
    const player = createPlayer();
    const specialWall = makeObstacle({ kind: 'special' });
    const normalWall = makeObstacle({ id: 'wall-2' });

    startDash(player, 0.6);

    expect(player).toMatchObject({ isDashing: true, dashKind: 'normal', dashTargetId: null });
    expect(intersectsPlayerObstacle(player, specialWall)).toBe(true);
    player.y = 80;
    expect(intersectsPlayerObstacle(player, normalWall)).toBe(true);
  });

  it('accepts the pre-arrival timing boundary and rejects early or passed walls', () => {
    expect(isSpecialTimingSuccess({
      playerX: 240,
      wallX: 300,
      speed: 240,
      windowSeconds: 0.25,
    })).toBe(true);
    expect(isSpecialTimingSuccess({
      playerX: 240,
      wallX: 361,
      speed: 240,
      windowSeconds: 0.25,
    })).toBe(false);
    expect(isSpecialTimingSuccess({
      playerX: 240,
      wallX: 239,
      speed: 240,
      windowSeconds: 0.25,
    })).toBe(false);
  });
});

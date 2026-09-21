import { describe, expect, it } from 'vitest';
import { WORLD_HEIGHT } from '../../src/game/constants.js';
import { applyLift, createPlayer, isOutOfBounds, updatePlayer } from '../../src/game/player.js';

describe('player', () => {
  it('starts in the center with the fixed gameplay dimensions', () => {
    expect(createPlayer()).toMatchObject({
      x: 240,
      y: 270,
      velocityY: 0,
      width: 36,
      height: 24,
      isDashing: false,
    });
  });

  it('applies one upward lift impulse', () => {
    const player = createPlayer();

    applyLift(player);

    expect(player.velocityY).toBe(-360);
  });

  it('falls when gravity is applied', () => {
    const player = createPlayer();

    updatePlayer(player, 0.1, 900);

    expect(player.velocityY).toBe(90);
    expect(player.y).toBe(279);
  });

  it('treats touching either boundary as out of bounds', () => {
    const player = createPlayer();

    player.y = player.height / 2;
    expect(isOutOfBounds(player, WORLD_HEIGHT)).toBe(true);

    player.y = WORLD_HEIGHT - player.height / 2;
    expect(isOutOfBounds(player, WORLD_HEIGHT)).toBe(true);
  });
});

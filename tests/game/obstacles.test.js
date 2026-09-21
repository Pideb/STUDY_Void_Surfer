import { describe, expect, it } from 'vitest';
import { createObstacle, updateObstacle } from '../../src/game/obstacles.js';

describe('obstacles', () => {
  it('creates a normal obstacle with a clamped gap', () => {
    const obstacle = createObstacle({
      id: 'wall-1',
      x: 1000,
      gapCenter: 0,
      gapHeight: 180,
      rng: () => 0.25,
    });

    expect(obstacle).toMatchObject({
      id: 'wall-1',
      x: 1000,
      width: 72,
      gapCenter: 90,
      gapHeight: 180,
      kind: 'normal',
      visualSeed: 0.25,
      passed: false,
    });
  });

  it('keeps a special wall and warning index in its model', () => {
    const obstacle = createObstacle({
      id: 'special-1',
      x: 900,
      gapCenter: 270,
      gapHeight: 135,
      kind: 'special',
      warningIndex: 5,
    });

    expect(obstacle.kind).toBe('special');
    expect(obstacle.warningIndex).toBe(5);
  });

  it('moves left according to speed and delta', () => {
    const obstacle = createObstacle({ id: 'wall-1', x: 1000, gapCenter: 270, gapHeight: 180 });

    updateObstacle(obstacle, 0.5, 240);

    expect(obstacle.x).toBe(880);
  });
});

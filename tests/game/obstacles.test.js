import { describe, expect, it } from 'vitest';
import { createObstacle, getDashBarrierBounds, isDashObstacle, updateObstacle } from '../../src/game/obstacles.js';

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
      stageId: null,
      movingGap: false,
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
    expect(obstacle.width).toBe(24);
    expect(obstacle.movingGap).toBe(false);
    expect(obstacle.warningIndex).toBe(5);
  });

  it('keeps the hybrid barrier centered inside an ordinary stationary gap wall', () => {
    const wall = createObstacle({ id: 'hybrid', kind: 'hybrid', x: 400, gapCenter: 270, gapHeight: 180, movingGap: true, showTimingGuide: true });
    expect(wall).toMatchObject({ kind: 'hybrid', width: 72, movingGap: false, barrierBroken: false, showTimingGuide: true });
    expect(isDashObstacle(wall)).toBe(true);
    expect(getDashBarrierBounds(wall)).toEqual({ x: 424, width: 24 });
    updateObstacle(wall, 0.5, 240, 10);
    expect(getDashBarrierBounds(wall)).toEqual({ x: 304, width: 24 });
    expect(wall.gapCenter).toBe(270);
  });

  it('moves left according to speed and delta', () => {
    const obstacle = createObstacle({ id: 'wall-1', x: 1000, gapCenter: 270, gapHeight: 180 });

    updateObstacle(obstacle, 0.5, 240);

    expect(obstacle.x).toBe(880);
  });

  it('stores the stage that spawned an obstacle as visual metadata', () => {
    const obstacle = createObstacle({
      id: 'industrial-wall-1',
      x: 1000,
      gapCenter: 270,
      gapHeight: 180,
      stageId: 'industrial-void',
    });

    expect(obstacle.stageId).toBe('industrial-void');
  });

  it('moves a normal gap sinusoidally without leaving its valid bounds', () => {
    const obstacle = createObstacle({
      id: 'moving-1',
      x: 1000,
      gapCenter: 270,
      gapHeight: 180,
      movingGap: true,
      gapMotionPhase: 0,
      gapMotionCycleSeconds: 2.4,
    });

    updateObstacle(obstacle, 0.1, 240, 0.6);

    expect(obstacle).toMatchObject({
      width: 72,
      movingGap: true,
      baseGapCenter: 270,
      gapMotionAmplitude: 90,
      gapMotionCycleSeconds: 2.4,
    });
    expect(obstacle.gapCenter).toBeCloseTo(360);
    expect(obstacle.gapCenter).toBeGreaterThanOrEqual(90);
    expect(obstacle.gapCenter).toBeLessThanOrEqual(450);
  });
});

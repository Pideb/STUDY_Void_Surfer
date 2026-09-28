import { describe, expect, it } from 'vitest';
import { advanceScore } from '../../src/game/score.js';

describe('score', () => {
  it('awards one point the first time an obstacle is passed', () => {
    const session = { score: 0, passedObstacleIds: new Set() };

    expect(advanceScore(session, 'wall-1')).toBe(true);
    expect(session.score).toBe(1);
    expect(session.progressionScore).toBe(1);
  });

  it('does not award duplicate points for the same obstacle', () => {
    const session = { score: 3, passedObstacleIds: new Set() };

    advanceScore(session, 'wall-1');
    expect(advanceScore(session, 'wall-1')).toBe(false);
    expect(session.score).toBe(4);
    expect(session.progressionScore).toBe(4);
  });

  it('initializes a missing passed-id set and preserves non-negative score', () => {
    const session = { score: -2 };

    expect(advanceScore(session, 'wall-1')).toBe(true);
    expect(session.score).toBe(1);
    expect(session.passedObstacleIds.has('wall-1')).toBe(true);
  });

  it('increments raw score and monotonic progression by unmultiplied points', () => {
    const session = { score: 4, progressionScore: 9, passedObstacleIds: new Set() };

    expect(advanceScore(session, 'wall-1')).toBe(true);
    expect(session.score).toBe(5);
    expect(session.progressionScore).toBe(10);
  });
});

import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_KEYS,
  createChallenge,
  createChallengeFailureEffect,
  handleChallengeKey,
  updateChallenge,
} from '../../src/game/wasd-challenge.js';

describe('WASD boss challenge', () => {
  it('starts at four keys and reaches eight keys with a 2.3 second floor', () => {
    const early = createChallenge({ bossNumber: 3, rng: () => 0 });
    const late = createChallenge({ bossNumber: 9, rng: () => 0.99 });

    expect(early).toMatchObject({ maxKeys: 4, timeLimitSeconds: 5 });
    expect(early.sequence.length).toBeGreaterThanOrEqual(3);
    expect(late).toMatchObject({ maxKeys: 8, timeLimitSeconds: 2.3 });
    expect(late.sequence).toHaveLength(8);
    expect(late.sequence.every((key) => CHALLENGE_KEYS.includes(key))).toBe(true);
  });

  it('accepts the sequence, rejects a wrong key, and times out deterministically', () => {
    const success = createChallenge({ bossNumber: 3, rng: () => 0 });
    for (const key of success.sequence.slice(0, -1)) expect(handleChallengeKey(success, key)).toBe('pending');
    expect(handleChallengeKey(success, success.sequence.at(-1))).toBe('success');
    expect(success.result).toBe('success');

    const failure = createChallenge({ bossNumber: 3, rng: () => 0 });
    expect(handleChallengeKey(failure, 'KeyD')).toBe('failure');
    expect(failure.active).toBe(false);

    const timeout = createChallenge({ bossNumber: 3, rng: () => 0 });
    expect(updateChallenge(timeout, 5)).toBe('failure');
    expect(createChallengeFailureEffect(() => 0).kind).toBe('ink');
    expect(createChallengeFailureEffect(() => 0.99).kind).toBe('glitch');
  });
});

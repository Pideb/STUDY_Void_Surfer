import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_KEYS,
  createChallenge,
  createChallengeFailureEffect,
  handleChallengeKey,
  updateChallenge,
} from '../../src/game/wasd-challenge.js';

describe('WASD boss challenge', () => {
  it('starts with five seconds and uses 2.8 seconds after the first boss', () => {
    const early = createChallenge({ bossNumber: 1, rng: () => 0 });
    const late = createChallenge({ bossNumber: 9, rng: () => 0.99 });

    expect(early).toMatchObject({ maxKeys: 4, timeLimitSeconds: 5 });
    expect(early.sequence).toHaveLength(4);
    expect(late).toMatchObject({ maxKeys: 8, timeLimitSeconds: 2.8 });
    expect(late.sequence).toHaveLength(8);
    expect(late.sequence.every((key) => CHALLENGE_KEYS.includes(key))).toBe(true);
  });

  it('increases the key ceiling per boss and never repeats a key four times', () => {
    for (let bossNumber = 1; bossNumber <= 10; bossNumber += 1) {
      const maximum = Math.min(8, bossNumber + 3);
      const short = createChallenge({ bossNumber, rng: () => 0 });
      const long = createChallenge({ bossNumber, rng: () => 0.99 });
      expect(short.sequence).toHaveLength(Math.max(4, maximum - 2));
      expect(long.sequence).toHaveLength(maximum);
      expect(long.remainingSeconds).toBe(bossNumber === 1 ? 5 : 2.8);
      expect(long.sequence.some((key, index, keys) => index >= 3
        && keys.slice(index - 3, index + 1).every((value) => value === key))).toBe(false);
    }
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
    expect(createChallengeFailureEffect(() => 0)).toMatchObject({ remainingSeconds: 8, durationSeconds: 8 });
  });
});

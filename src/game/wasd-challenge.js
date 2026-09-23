const CHALLENGE_KEYS = Object.freeze(['KeyW', 'KeyA', 'KeyS', 'KeyD']);

function roll(rng) {
  return Math.min(0.999999, Math.max(0, Number(rng?.()) || 0));
}

function getDifficulty(bossNumber) {
  const safeNumber = Math.max(3, Math.trunc(Number(bossNumber) || 3));
  return {
    maxKeys: Math.min(8, 4 + safeNumber - 3),
    timeLimitSeconds: Math.max(2.3, 5 - (safeNumber - 3) * 0.45),
  };
}

export function createChallenge({ bossNumber, rng = Math.random } = {}) {
  const { maxKeys, timeLimitSeconds } = getDifficulty(bossNumber);
  const minimumLength = Math.max(3, maxKeys - 2);
  const length = minimumLength + Math.floor(roll(rng) * (maxKeys - minimumLength + 1));
  const sequence = [];

  while (sequence.length < length) {
    let key = CHALLENGE_KEYS[Math.floor(roll(rng) * CHALLENGE_KEYS.length)];
    const last = sequence.at(-1);
    const beforeLast = sequence.at(-2);
    const beforeBeforeLast = sequence.at(-3);
    if (key === last && key === beforeLast && key === beforeBeforeLast) {
      const keyIndex = CHALLENGE_KEYS.indexOf(key);
      key = CHALLENGE_KEYS[(keyIndex + 1) % CHALLENGE_KEYS.length];
    }
    sequence.push(key);
  }

  return {
    active: true,
    sequence,
    cursor: 0,
    remainingSeconds: timeLimitSeconds,
    timeLimitSeconds,
    maxKeys,
    result: 'pending',
  };
}

export function handleChallengeKey(challenge, code) {
  if (!challenge?.active || !CHALLENGE_KEYS.includes(code)) return challenge?.result ?? 'ignored';
  if (challenge.sequence[challenge.cursor] !== code) {
    challenge.active = false;
    challenge.result = 'failure';
    return challenge.result;
  }

  challenge.cursor += 1;
  if (challenge.cursor >= challenge.sequence.length) {
    challenge.active = false;
    challenge.result = 'success';
  }
  return challenge.result;
}

export function updateChallenge(challenge, deltaSeconds) {
  if (!challenge?.active || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) return challenge?.result ?? 'ignored';
  challenge.remainingSeconds = Math.max(0, challenge.remainingSeconds - deltaSeconds);
  if (challenge.remainingSeconds === 0) {
    challenge.active = false;
    challenge.result = 'failure';
  }
  return challenge.result;
}

export function createChallengeFailureEffect(rng = Math.random) {
  return {
    kind: roll(rng) < 0.5 ? 'ink' : 'glitch',
    remainingSeconds: 0.75,
    durationSeconds: 0.75,
  };
}

export { CHALLENGE_KEYS };

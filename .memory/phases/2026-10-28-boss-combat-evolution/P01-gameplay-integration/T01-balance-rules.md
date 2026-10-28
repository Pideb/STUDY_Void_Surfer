# Task: T01 Balance rules and challenge limits

## Status: in_progress

## Goal
Cap score-driven speed at150, shorten encounter spacing, apply approved WASD limits and4s penalties without changing aircraft/scoring conventions.

## Decision Summary
- Implement approved decisions in .memory/decisions/2026-10-27-boss-combat-evolution.md, without reopening accepted art/audio/balance.
- Preserve existing engine/state/aircraft interfaces. No external DB or credentials required.

## Implementation

### I01. Runtime behavior and public contracts
- Related Files: `src/game/constants.js` (balance exports), `src/game/difficulty.js::getBaseSpeed`, `src/game/wasd-challenge.js::{getDifficulty,createChallengeFailureEffect}`, `tests/game/{difficulty,wasd-challenge,game-engine}.test.js`.

#### Details
- **Signatures & Types**:
```typescript
getBaseSpeed(progressionScore: number): number; createChallenge({bossNumber:number,rng?:()=>number}): Challenge; createChallengeFailureEffect(rng?:()=>number): {kind:'ink'|'glitch',remainingSeconds:number,durationSeconds:number}
```
- **Data & Schema Fields**: Add SPEED_CAP_SCORE=150; WARNING_SCORE_STEP_MIN=5/MAX=8; BOSS_LATER_CHALLENGE_TIME_LIMIT_SECONDS=2.8; CHALLENGE_FAILURE_EFFECT_SECONDS=4. Existing boss multipliers .75/1.25, Velocity2x and fast adjustment .88 stay. Challenge fields/sequence progression stay unchanged.
- **Execution Flow / Logic**:
  1. Precondition & Validation: normalize finite inputs, retain existing API defaults and engine state guards. Handle absent optional browser APIs through existing fallbacks.
  2. Core Processing: Clamp normalized progression only inside getBaseSpeed before floor(score/10). Pause score deductions must never reduce progressionScore. getDifficulty retains capped base in every mode; engine encounter snapshots continue locking capped entry base. First boss5s, all later2.8s, three-to-eight keys unchanged. Penalty remains random ink/glitch but4s. Preserve special10 and first-clear moving/hybrid unlocks.
  3. Error & Exception Handling: deterministic fallback for missing assets/API, no unhandled promise rejection or permanently paused combat; malformed inputs must not introduce NaN/Infinity. Do not conceal validation failures.
  4. State Transition & Return: expose independent snapshot data; advance engine phases only once; restart/menu clear transient state.

### I02. Verification and regression coverage
- Related Files: tests listed above; modify existing superseded expectations and add focused behavioral tests.
#### Details
Boundary scores149/150/151/10000/invalid, capped boss base with multipliers, Velocity ceiling via engine, elapsed-time independence, inclusive5..8 gap RNG extremes, first/later challenge durations and failure effect4s. Existing tests describing old durations/ranges must be updated only where superseded.

## Acceptance Criteria
- [ ] Cap score-driven speed at150, shorten encounter spacing, apply approved WASD limits and4s penalties without changing aircraft/scoring conventions.
- [ ] Actual runtime integration preserves earlier completed Tasks and existing guest/admin/aircraft behavior.
- [ ] Specified validation passes; evidence recorded below.

## Validation
- `npx vitest run tests/game/difficulty.test.js tests/game/wasd-challenge.test.js tests/game/game-engine.test.js` — passes

## Commit Message
```text
feat(difficulty): cap progression speed and tune encounter pacing

Plan: 2026-10-28-boss-combat-evolution
Phase: P01-gameplay-integration
Task: T01-balance-rules

- Cap score-driven speed at150, shorten encounter spacing, apply approved WASD limits and4s penalties without changing aircraft/scoring conventions.
- Validate actual state transitions and regression boundaries
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending


# Task: T03 Boss Speed Transition

## Status: pending

## Goal
Keep each boss's base scroll-speed target fixed from encounter entry, preserve deliberate shift-pattern alternation, and interpolate any scroll-speed target change over one second.

## Decision Summary
- Capture the boss base scroll speed on entry; score progression earned during that encounter does not raise the boss's base target.
- Slow/fast targets stay fixed for the encounter; shift targets alternate every two seconds relative to boss entry and interpolate over one second.
- Apply smoothing to all target scroll-speed changes, including score-based speed steps and aircraft modifiers, while exposing current and target speed state to snapshots.

## Implementation

### I01. Store boss-entry speed and interpolate effective scroll speed
- Related Files:
  - `src/game/game-engine.js` :: `beginWarningSession`, `getCurrentDifficulty`, `applyAircraftDifficulty`, `update`, `start` — store boss-entry speed and update interpolation; modify
  - `src/game/constants.js` :: add `SPEED_TRANSITION_SECONDS = 1`; modify
  - `tests/game/game-engine.test.js` :: boss speed and speed transition tests; modify
- **Signatures & Types**:
  ```js
  // Boss encounter additions:
  // baseScrollSpeed: number (px/s), bossStartElapsedSeconds: number
  // Engine transition state:
  // { fromSpeed: number, targetSpeed: number, elapsedSeconds: number, durationSeconds: 1 }
  ```
- **Data & Schema Fields**:
  - `bossEncounter.baseScrollSpeed`: numeric px/s, captured from `getDifficulty(...).baseSpeed` at `beginWarningSession`; immutable for this encounter.
  - `bossEncounter.bossStartElapsedSeconds`: numeric game elapsed time at entry; used to phase shift patterns from encounter start.
  - `speedTransition`: nullable in-memory engine state with `fromSpeed`, `targetSpeed`, `elapsedSeconds`, `durationSeconds`, and direction (`'up' | 'down' | null`); expose a serializable snapshot view as `speedChange: { direction, remainingSeconds } | null`.
- **Execution Flow / Logic**:
  1. When beginning a boss session, obtain base speed from the current progression score and store it on the encounter.
  2. For slow/fast, calculate target speed from the stored base times the selected boss multiplier. For shift, calculate the multiplier using `(elapsedSeconds - bossStartElapsedSeconds)` so it starts in its slow phase and flips every 2 seconds.
  3. Preserve aircraft semantics: VELOCITY's fast-boss adjustment still applies to the high target, AEGIS movement modifiers remain applied as before, and score multiplier does not affect movement speed.
  4. Track the current scroll speed separately from the target. When the target changes, start a linear interpolation from the current value to the new target over exactly one second; if the target changes mid-ramp, restart from the current interpolated value rather than jumping.
  5. Advance interpolation by frame delta and use the current interpolated speed for player-world movement, backgrounds, obstacles, moving-gap visuals, projectile base speed, and `difficulty.scrollSpeed` consumed by collision/timing code. Preserve `difficulty.baseSpeed` as the untweened progression reference and expose target/current fields only as needed by the HUD/test contract.
  6. Initialize current speed at the normal start target so the first frame does not produce a false acceleration indicator.
- **Error & Exception Handling**: Clamp interpolation progress to `[0, 1]`; avoid NaN when delta is zero or target speed is invalid; cap delta using the existing `MAX_FRAME_DELTA_SECONDS` rule.
- **State Transition & Return**: A target change follows a continuous one-second ramp; constant slow/fast boss patterns do not drift with score during the encounter; shift changes are smooth.

### I02. Add deterministic speed-profile tests
- Related Files:
  - `tests/game/game-engine.test.js` :: boss entry lock, shift cadence, speed interpolation, target reversal tests — modify
  - `tests/game/difficulty.test.js` :: retain target multiplier tests and update only for the boss-entry-relative shift contract if the helper is changed — modify if needed
- **Test Cases**:
  - A slow and fast boss retain their captured target when `progressionScore` advances within the encounter.
  - Shift is slow at boss-relative `0s`, fast at `2s`, and slow at `4s`.
  - A transition at `0.5s` reaches the midpoint; at `1s` reaches the target.
  - Reversing a target mid-transition starts from the current speed without a discontinuity.
  - VELOCITY's fast adjustment and AEGIS movement parameters retain their existing behavior.

## Acceptance Criteria
- [ ] Slow/fast boss speed targets remain fixed for the full encounter despite score progression.
- [ ] Shift targets alternate on boss-relative two-second intervals and are reached through one-second interpolation.
- [ ] Normal score-step and aircraft speed changes no longer cause instantaneous scroll-speed jumps.
- [ ] Existing aircraft and boss speed tests pass with their correct target/current distinction.

## Validation
- `npm test -- --run tests/game/game-engine.test.js tests/game/difficulty.test.js` — all targeted tests pass.

## Commit Message
```text
feat(game): smooth and lock boss speed profiles

Plan: 2026-10-21-boss-flow-speed-feedback
Phase: P01-boss-gameplay-feedback
Task: T03-boss-speed-transition

- Lock each boss base speed at encounter start
- Interpolate speed target changes over one second
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

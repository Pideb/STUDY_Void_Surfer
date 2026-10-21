# Task: T02 Moving Gap Cadence

## Status: pending

## Goal
Slow vertical gap oscillation to 4.8 seconds in normal play and 3.2 seconds in WARNING/BOSS without changing the existing movement amplitude or collision geometry.

## Decision Summary
- Set `NORMAL_MOVING_GAP_CYCLE_SECONDS` to `4.8` and `WARNING_MOVING_GAP_CYCLE_SECONDS` to `3.2`.
- Continue using the existing sinusoidal visual/collision center calculation; only its period changes.

## Implementation

### I01. Update cadence constants and expected snapshots
- Related Files:
  - `src/game/constants.js` :: `NORMAL_MOVING_GAP_CYCLE_SECONDS`, `WARNING_MOVING_GAP_CYCLE_SECONDS` — modify the wall oscillation periods
  - `tests/game/game-engine.test.js` :: normal and WARNING moving-gap spawn tests — update expected cycle fields; modify
  - `tests/game/obstacles.test.js` :: `updateObstacle` cycle tests — retain the explicit 2.4-second unit fixture where it tests arbitrary input; modify only if it assumes the gameplay constant

#### Details
- **Signatures & Types**:
  ```js
  export const NORMAL_MOVING_GAP_CYCLE_SECONDS = 4.8;
  export const WARNING_MOVING_GAP_CYCLE_SECONDS = 3.2;
  ```
- **Data & Schema Fields**:
  - Obstacle `gapMotionCycleSeconds` remains a number in seconds; `gapMotionAmplitude` and `baseGapCenter` remain unchanged.
- **Execution Flow / Logic**:
  1. Normal moving walls continue to select the normal cadence.
  2. Warning and boss moving walls continue to select the WARNING cadence.
  3. Do not modify `MOVING_GAP_AMPLITUDE`, `updateObstacle` collision position, or gap center constraints.
- **Error & Exception Handling**: Existing obstacle update fallback for invalid/non-positive cycle values remains unchanged.
- **State Transition & Return**: Gap center still oscillates around the same base center, completing one full cycle at the selected duration.

### I02. Verify the slower cycle in tests
- Related Files:
  - `tests/game/game-engine.test.js` :: moving-gap cadence assertions — assert normal `4.8` and warning/boss `3.2`; modify
  - `tests/game/obstacles.test.js` :: sinusoidal gap movement tests — verify movement at fixed elapsed-time samples; read-only unless a constant-based expectation exists
- **Test Cases**: Spawn one normal moving wall and one WARNING moving wall; assert their exact cycle values and verify the gap center still follows its base/amplitude phase behavior.

## Acceptance Criteria
- [ ] Snapshot cycle values are 4.8 seconds in normal play and 3.2 seconds during WARNING/BOSS.
- [ ] Amplitude and collision geometry remain unchanged.

## Validation
- `npm test -- --run tests/game/game-engine.test.js tests/game/obstacles.test.js` — all targeted tests pass.

## Commit Message
```text
feat(game): slow moving gap wall motion

Plan: 2026-10-21-boss-flow-speed-feedback
Phase: P01-boss-gameplay-feedback
Task: T02-moving-gap-cadence

- Increase normal and warning moving-gap cycle periods
- Preserve gap range and collision behavior
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

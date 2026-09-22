# Task: T01 Warning Engine Timing and Obstacle Lifetime

## Status: done

## Goal

Reduce the frequency and widen the unpredictability of WARNING entry without changing the first 20-point trigger or the fifth-segment BOSS rule. Make special-wall success require twice the precision in every mode, and retain scored obstacles in render snapshots until their full body leaves the left side of the world.

## Decision Summary

- First WARNING remains at score 20. Every completed WARNING/BOSS schedules the next start at the current score plus a uniformly random integer from 10 through 15, inclusive.
- Special timing windows become 0.25 seconds in normal play and 0.125 seconds in WARNING/BOSS.
- Passing an obstacle scores it once but does not remove it until `obstacle.x + obstacle.width < 0`.

## Implementation

### I01. Replace fixed WARNING score steps with a stored randomized threshold

- Related Files:
  - `src/game/constants.js` :: WARNING score and timing constants; modify
  - `src/game/difficulty.js` :: `getDifficulty`, new `chooseWarningScoreStep`; modify
  - `src/game/game-engine.js` :: warning lifecycle state, `getCurrentDifficulty`, `startWarningIfNeeded`, `processPassedObstacles`, `start`; modify

#### Details

- Replace `WARNING_SCORE_STEP` with two exported constants: `WARNING_SCORE_STEP_MIN = 10` and `WARNING_SCORE_STEP_MAX = 15`. Retain `WARNING_START_SCORE = 20`.
- Change `NORMAL_TIMING_WINDOW_SECONDS` from `0.5` to `0.25` and `WARNING_TIMING_WINDOW_SECONDS` from `0.25` to `0.125`.
- Export `chooseWarningScoreStep(rng = Math.random)`. It must sanitize the roll in the same way as existing random helpers, map it to an inclusive integer range, and satisfy: a roll of `0` returns 10; a roll just below `1` returns 15; invalid/non-numeric rolls behave as 10.
- Extend `getDifficulty` with a final optional `nextWarningScore` argument, defaulting to `WARNING_START_SCORE`. Normalize that argument to a non-negative whole score before using it. Its existing return field `nextWarningScore` must now reflect that supplied threshold; `isWarning` remains `safeScore >= nextWarningScore`. Keep the existing parameter order and defaults intact for old callers.
- In `createGameEngine`, add private `nextWarningScore`, initialize/reset it to `WARNING_START_SCORE`, and pass it to every `getDifficulty` invocation, including the active-session branch.
- When a WARNING/BOSS session completes in `processPassedObstacles`, increment `completedWarningCount`, set `nextWarningScore = getScore() + chooseWarningScoreStep(rng)`, clear the session, and retain the existing spawn accumulator reset. Do not pick a new threshold when a segment merely starts.
- Preserve BOSS selection as every fifth active segment (`warningIndex % 5 === 0`), forced special-wall counts, speed-pattern selection, and pause/reset semantics.

### I02. Decouple scoring from obstacle render lifetime and expose a special-break effect model

- Related Files:
  - `src/game/constants.js` :: `SPECIAL_BREAK_DURATION_SECONDS`; modify
  - `src/game/game-engine.js` :: `update`, `dash`, `processPassedObstacles`, `getSnapshot`; modify
  - `src/game/obstacles.js` :: obstacle model defaults; modify if a default break-effect field is needed for consistent snapshots

#### Details

- Add `SPECIAL_BREAK_DURATION_SECONDS = 0.25`.
- A successful special dash must attach `breakEffect` to its targeted special obstacle with exactly these fields:
  ```js
  {
    centerY: number,              // player.y at successful dash input
    remainingSeconds: number,     // starts at SPECIAL_BREAK_DURATION_SECONDS
    durationSeconds: number,      // SPECIAL_BREAK_DURATION_SECONDS
  }
  ```
- Attach the effect only when `isSpecialTimingSuccess` is true and `startDash` receives the special target ID. Normal dashes and failed/early special attempts must never add `breakEffect`.
- On each active `update`, decrement each obstacle's `breakEffect.remainingSeconds` by the clamped frame delta and remove the property at zero. Do this without changing obstacle speed, collision, or score state.
- In `processPassedObstacles`, keep the existing one-time `passed` and `advanceScore` logic. Replace the final collection filter with only the left-edge lifetime rule: retain every obstacle, passed or unpassed, while `obstacle.x + obstacle.width >= 0`; remove it only after its whole width exits left.
- Keep collision safe: passed obstacles are already behind the player when marked, and the special-dash target selector must continue excluding `passed` walls. Do not mark an obstacle unpassed or score it a second time.
- `getSnapshot()` must clone nested `breakEffect` objects (`breakEffect: obstacle.breakEffect ? { ...obstacle.breakEffect } : null`) so caller mutation cannot modify engine state.

### I03. Extend deterministic engine and difficulty tests

- Related Files:
  - `tests/game/difficulty.test.js` :: timing-window, random-step, and custom-threshold tests; modify
  - `tests/game/game-engine.test.js` :: WARNING completion, obstacle lifetime, break-effect lifecycle, and snapshot isolation tests; modify
  - `tests/game/collision.test.js` :: timing-boundary tests; modify only if fixed 0.5/0.25 assumptions exist

#### Details

- Assert normal and WARNING/BOSS difficulties expose `0.25` and `0.125` timing windows respectively.
- Assert `chooseWarningScoreStep` maps deterministic minimum and maximum rolls to 10 and 15, and `getDifficulty` respects an explicitly supplied next threshold rather than deriving a fixed multiple of 10.
- Use injected deterministic RNG values to complete a warning segment. Assert the engine reports no active segment below the newly stored `score + step` threshold and begins the next one at/after it; retain the fifth-warning BOSS test with an explicitly compatible initial score/threshold setup.
- Assert a passed obstacle remains in snapshots while it is still partially visible (`x + width >= 0`) and disappears only once fully left of zero, while its score increments exactly once.
- Assert a successful special dash creates the stated break-effect fields, a normal dash does not, the effect expires after 0.25 seconds of updates, and mutating `snapshot.obstacles[n].breakEffect` does not mutate the next snapshot.

## Acceptance Criteria

- [ ] First WARNING begins at 20; after a completed segment, the next begins only after a deterministic/testable random 10--15 score gain.
- [ ] Normal special timing is 0.25 seconds and WARNING/BOSS timing is 0.125 seconds.
- [ ] Passed walls stay in the render snapshot until fully off the left edge without additional collision or scoring.
- [ ] Only successful special dashes create a 0.25-second, snapshot-safe break-effect model.

## Validation

- `npm run test -- --run tests/game/difficulty.test.js tests/game/collision.test.js tests/game/game-engine.test.js` - engine and timing tests pass.
- `npm run test -- --run` - complete suite passes.
- `npm run build` - production build completes.

## Commit Message

```text
feat(game): refine warning cadence and special timing

Plan: 2026-09-22-warning-difficulty-feedback
Phase: P01-warning-difficulty-feedback
Task: T01-warning-engine-timing

- randomize completed warning recurrence and halve special timing windows
- retain passed walls through the viewport and expose special break state
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending

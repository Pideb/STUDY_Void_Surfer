# Task: T02 Boss-Gated Stage Progression

## Status: done

## Goal
Remove 30-second stage rotation. After a boss is actually cleared, change to the next shuffled stage only after two subsequent passed obstacles, counting both ordinary and special walls. Preserve the per-run shuffled stage order and the original visual ownership of already-spawned obstacles.

## Decision Summary
- A boss clear arms a two-obstacle countdown; obstacles passed before that clear do not count.
- Decrement once for every newly passed obstacle after the clear, regardless of `kind`.
- On the second pass, advance the stage and transition its background. New obstacles receive the new stage ID; existing obstacles keep their stored ID.
- Boss combat must remain defeatable: preserve each existing seven-wall wave's normal/special probability and minimum three special walls, but repeat equivalent waves while HP remains. Preserve the two-normal-wall projectile cooldown and keep projectiles from overlapping unresolved special walls.

## Implementation

### I01. Boss-clear countdown and stage advance
- Related Files:
  - `src/game/game-engine.js` :: `start`, `processPassedObstacles`, `advanceStage`, `updateStage`, `completeBossIfReady`, `update`, `spawnObstacle`, and `getSnapshot`; modify.
  - `src/game/constants.js` :: remove `STAGE_ROTATION_SECONDS` if no remaining consumer; modify.
  - `tests/game/game-engine.test.js`; modify.

#### Details
- **State**: add internal integer `wallsUntilStageAdvance`, initialized to `0` in `createGameEngine` and reset to `0` in `start()`.
- **State transition**:
  1. In `completeBossIfReady()`, only when existing clear conditions are satisfied (`warningSession.isBoss`, `hp <= 0`, no active attack/challenge), set `wallsUntilStageAdvance = 2` before clearing `bossEncounter`/`warningSession`.
  2. In `processPassedObstacles()`, for every obstacle that transitions from `passed === false` to `true`, decrement the positive countdown exactly once. Do this independent of `obstacle.kind`; do not count any obstacle already marked passed before the boss clear.
  3. When it reaches zero, call `advanceStage()` once and clear/guard the countdown so later wall passes cannot advance repeatedly until another boss is cleared.
  4. Remove the elapsed-time condition that calls `advanceStage()` from `updateStage()`. Keep transition progress updates in `updateStage()` or move them only as needed for distance-based animation in P02.
  5. Keep `stageOrder = createStageShuffleBag(stageRng)` in `start()` and the bag-boundary no-immediate-repeat behavior. Do not alter run restart dispatch.
  6. Keep `spawnObstacle()` assigning `stageId` at creation. Never rewrite `stageId` on existing obstacles when the stage changes; `renderer.render()` already uses that value.
- **Boss wave continuity**:
  1. Keep `BOSS_OBSTACLE_COUNT`, `BOSS_MIN_SPECIALS`, `WARNING_SPECIAL_CHANCE`, and the existing special-selection/forced-minimum algorithm unchanged. A repeated boss wave uses the same `targetCount` and `requiredSpecials`; do not introduce a different special-to-normal ratio.
  2. Only begin another wall wave if `bossEncounter.hp > 0`, the current wave has spawned all `targetCount` obstacles, all current-wave obstacles have passed, `specialObstacleIds` is empty, there is no active projectile/laser attack, and no WASD challenge is active.
  3. Reset only per-wave fields (`spawnedCount`, `specialSpawnedCount`, and spawn accumulator) and keep `warningSession.index`, `warningSession.isBoss`, boss HP/reflection count, boss pattern, and encounter cooldown state intact.
  4. Do not schedule the next projectile until the current boss wave has spawned all walls, all special walls are resolved, the previous attack is finished, and `normalWallsSinceProjectile >= BOSS_PROJECTILE_NORMAL_WALL_COOLDOWN`. This keeps projectiles separate from unresolved special walls and honors the existing two-normal-wall cooldown.
  5. Do not generate another wave after boss HP reaches zero. `completeBossIfReady()` remains the sole place that clears the boss and arms the stage countdown.
- **Transition/snapshot**: retain `stage.transition.fromKey`, `toKey`, `progress`, and duration/travel state required by the existing renderer. P02 T04 will make the transition distance-driven; do not reintroduce timed stage rotation here.
- **Tests**:
  - Replace the existing test expecting rotation at 30 s with a test that survives more than 30 s without a boss clear and asserts the stage ID is unchanged.
  - Test that a boss-clear condition arms exactly two subsequent wall passes and does not advance after the first.
  - Test that the second subsequent pass changes stage exactly once.
  - Ensure one ordinary plus one special wall counts as two.
  - Ensure a wall already spawned before the transition keeps its previous `stageId`, while a wall spawned after it gets the new `stageId`.
  - Simulate a boss with deterministic RNG through more than one seven-wall wave; assert wave counters restart only after the current wave and attack are resolved, each wave retains the minimum special requirement, and combat continues until HP reaches zero.
  - Assert an additional wave is not spawned once boss HP reaches zero.
  - Retain the test that each run exposes all six shuffled stage IDs.

## Acceptance Criteria
- [x] No elapsed-time-only stage rotation remains.
- [x] Stage advances exactly after the second wall passed after boss clear.
- [x] Both wall types count, and pre-clear passes do not count.
- [x] Shuffled order and spawn-time `stageId` behavior remain intact.

## Validation
- `npm test -- --run tests/game/game-engine.test.js tests/game/stages.test.js tests/game/obstacles.test.js` — all tests pass.

## Commit Message
```text
feat(game): gate stage changes behind boss clears

Plan: 2026-09-28-gameplay-visual-polish
Phase: P01-gameplay-rules
Task: T02-boss-gated-stage-progression

- Replace timed stage rotation with boss-clear progression
- Advance after two passed walls while preserving per-obstacle stage art
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

# Task: T01 Obstacle Runtime

## Status: pending

## Goal

At score 15, special walls must begin spawning as 24px full-height, dash-only barriers, including the first one. At score 50, half of ordinary walls must gain a vertically moving gap whose collision geometry stays synchronized with its visible position.

## Decision Summary

- Set the special-wall unlock threshold to 15. A special wall has width 24px, no passable gap, and only an active dash targeted at that wall grants collision immunity; ordinary walls never gain dash immunity.
- From score 50 onward, roll a 50% moving-gap chance only after an obstacle has been classified as `normal`. Moving gaps use a sinusoid with ±90px amplitude, generated phase, and a cycle fixed at spawn time: 2.4 seconds in regular play, 1.6 seconds when spawned in WARNING or BOSS play.

## Implementation

### I01. Extend obstacle constants, difficulty, and model

- Related Files:
  - `src/game/constants.js` :: add named constants for the 15-point special unlock, 24px special width, 50-point moving-gap unlock, 0.5 moving-gap chance, 90px amplitude, and 2.4/1.6-second cycles; modify
  - `src/game/difficulty.js` :: `getDifficulty`, `shouldSpawnMovingGap`; modify
  - `src/game/obstacles.js` :: `createObstacle`, `updateObstacle`; modify
  - `tests/game/difficulty.test.js` :: score thresholds and probability eligibility; modify
  - `tests/game/obstacles.test.js` :: normal/special width and moving-gap model behavior; modify

#### Details

- **Signatures & Types**:
  ```js
  export const SPECIAL_UNLOCK_SCORE = 15;
  export const SPECIAL_OBSTACLE_WIDTH = 24;
  export const MOVING_GAP_UNLOCK_SCORE = 50;
  export const MOVING_GAP_CHANCE = 0.5;
  export const MOVING_GAP_AMPLITUDE = 90;
  export const NORMAL_MOVING_GAP_CYCLE_SECONDS = 2.4;
  export const WARNING_MOVING_GAP_CYCLE_SECONDS = 1.6;

  export function shouldSpawnMovingGap(rng, difficulty);
  export function createObstacle({
    id, x, gapCenter, gapHeight, kind, warningIndex, movingGap,
    gapMotionPhase, gapMotionAmplitude, gapMotionCycleSeconds, rng,
  });
  export function updateObstacle(obstacle, deltaSeconds, speed, elapsedSeconds);
  ```
- **Data & Schema Fields**:
  - `difficulty.movingGapChance`: number; `0` before score 50 and `0.5` at/after score 50. It applies regardless of normal/WARNING/BOSS difficulty, but the engine must only use it for `normal` obstacles.
  - `obstacle.width`: number; `SPECIAL_OBSTACLE_WIDTH` for `kind === 'special'`, otherwise `OBSTACLE_WIDTH`.
  - `obstacle.movingGap`: boolean; true only for normal moving-gap walls.
  - `obstacle.baseGapCenter`: number; clamped generated center used as the sinusoid's resting center.
  - `obstacle.gapMotionPhase`: number in radians; use a deterministic generated phase so simultaneous moving walls are not identical.
  - `obstacle.gapMotionAmplitude`: number; `90` for moving walls and `0` otherwise.
  - `obstacle.gapMotionCycleSeconds`: positive number; 2.4 or 1.6 when moving, `null` otherwise.
  - `obstacle.gapCenter`: number; current, clamped collision/render center. It must be recomputed from `baseGapCenter + amplitude * sin(2π * elapsedSeconds / cycle + phase)` on every update for moving walls.
- **Execution Flow / Logic**:
  1. `getDifficulty` normalizes score as it already does, changes `specialChance` eligibility to score >= 15, and adds `movingGapChance` as `0.5` only for score >= 50.
  2. `shouldSpawnMovingGap` uses the same safe `[0, 0.999999]` random normalization behavior as special rolling and returns true only when the roll is below `difficulty.movingGapChance`.
  3. `createObstacle` always clamps its generated center against `gapHeight`. It sets special width to 24, keeps special barriers non-moving, and retains existing normal width for normal walls. For a moving normal wall it stores the base center, phase, amplitude, and cycle; initialize `gapCenter` from the base center.
  4. `updateObstacle` continues to move `x` left by `speed * deltaSeconds`. When `movingGap` is true and `elapsedSeconds` is finite, recompute `gapCenter` using the stored sine parameters, then clamp it so the gap cannot leave the world. Non-moving and special obstacles retain their prior `gapCenter` behavior.
  5. Preserve `intersectsPlayerObstacle` semantics: a special wall collides across its full height unless `player.isDashing` and `player.dashTargetId` matches that exact obstacle. Do not grant a dash effect to normal or moving-gap walls.
- **Error & Exception Handling**:
  - Continue existing finite-number guards. Invalid/missing moving-gap fields must leave the obstacle's previously valid `gapCenter` unchanged rather than producing `NaN` collision geometry.
  - A `kind: 'special'` request always forces `movingGap: false`, even if a caller supplies moving fields.

### I02. Wire spawning, elapsed-time updates, and special-wall regression coverage

- Related Files:
  - `src/game/game-engine.js` :: `spawnObstacle`, `update`, snapshot flow; modify
  - `tests/game/game-engine.test.js` :: deterministic gameplay cases; modify
  - `tests/game/collision.test.js` :: targeted dash and normal-wall regression cases; modify

#### Details

- **Execution Flow / Logic**:
  1. In `spawnObstacle`, choose `kind` first using the existing forced-special WARNING/BOSS guarantees and `shouldSpawnSpecial`.
  2. Only when `kind === 'normal'`, roll `shouldSpawnMovingGap(rng, difficulty)`. Never consume this moving-gap roll for special walls.
  3. Pass the generated moving flag and the correct cycle to `createObstacle`: use 1.6 seconds when the active difficulty is WARNING or BOSS, otherwise 2.4 seconds. Generate a per-obstacle phase from the supplied RNG.
  4. In the frame update loop, pass the engine's accumulated `elapsedSeconds` to `updateObstacle` after elapsed time advances, before collision checks. Existing renderer and collision functions must therefore observe one current `gapCenter`.
  5. Leave warning completion logic unchanged: special IDs are removed only after passing, and moving normal walls count as ordinary score obstacles.
- **Test Scenarios**:
  - At score 14, special chance is zero; at score 15 it has normal special probability. At score 49, moving-gap chance is zero; at score 50 it is 0.5.
  - A `special` obstacle is width 24 and full-height collision. The first deterministically spawned special after starting with score 15 causes an obstacle game-over without dash, accepts a dash inside the timing window, and is immune only while dashing against that obstacle.
  - A normal wall never becomes dash-immune, including when a player is currently dashing toward a different special wall.
  - A deterministic normal wall at score 50 can be marked moving, changes `gapCenter` over elapsed time without exceeding its valid bounds, and has a 2.4-second cycle in regular play. A moving wall spawned during WARNING/BOSS records the 1.6-second cycle.
  - Existing WARNING minimum of two specials and BOSS minimum of three specials remains satisfied.

## Acceptance Criteria

- [ ] Special walls start at 15 points, use a 24px width, and the first spawned one is a reliable dash-only collision barrier.
- [ ] Moving gaps appear only on normal walls from score 50 with 50% eligibility, ±90px sinusoidal movement, and the approved regular/WARNING/BOSS periods.
- [ ] Collision and renderer consumers share the same current `gapCenter`; all existing WARNING/BOSS guarantees remain intact.

## Validation

- `npm run test -- --run tests/game/difficulty.test.js tests/game/obstacles.test.js tests/game/collision.test.js tests/game/game-engine.test.js` — runtime rule and regression coverage passes.
- `npm run test -- --run` — full suite passes.
- `npm run build` — production build succeeds.

## Commit Message

```text
feat(game): refine special and moving wall runtime

Plan: 2026-09-22-gameplay-refinements
Phase: P01-runtime-and-ui-refinements
Task: T01-obstacle-runtime

- unlock thin dash-only special walls at score fifteen
- add score-gated sinusoidal moving gaps for normal walls
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

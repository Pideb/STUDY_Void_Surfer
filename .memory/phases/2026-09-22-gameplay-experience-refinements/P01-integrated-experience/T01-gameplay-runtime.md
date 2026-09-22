# Task: T01 Gameplay Runtime

## Status: done

## Goal

Create one deterministic runtime contract for thin special walls, score-gated moving normal-wall gaps, and anytime dashes. The first special wall must be dash-only from score 15, ordinary dashes must never bypass any wall, and each run must identify its first five special walls for visual timing guidance.

## Decision Summary

- Special walls unlock at score 15, are 24px full-height barriers, and are passable only by a correctly timed dash targeted at that exact wall. Space always starts a short dash during `PLAYING`; non-timing dashes are visual-only.
- From score 50, 50% of normal walls receive a ±90px sinusoidal gap. Their period is 2.4 seconds when spawned in normal play and 1.6 seconds when spawned in WARNING/BOSS. Each game marks its first five special obstacles for a renderer timing guide.

## Implementation

### I01. Define obstacle and player state

- Related Files:
  - `src/game/constants.js` :: all new score, width, moving-gap, and guide constants; modify
  - `src/game/player.js` :: `createPlayer`; modify
  - `src/game/difficulty.js` :: `getDifficulty`, `shouldSpawnMovingGap`; modify
  - `src/game/obstacles.js` :: `createObstacle`, `updateObstacle`; modify
  - `tests/game/difficulty.test.js` :: score/probability eligibility; modify
  - `tests/game/obstacles.test.js` :: widths and moving-gap behavior; modify

#### Details

- **Constants and Signatures**:
  ```js
  export const SPECIAL_UNLOCK_SCORE = 15;
  export const SPECIAL_OBSTACLE_WIDTH = 24;
  export const MOVING_GAP_UNLOCK_SCORE = 50;
  export const MOVING_GAP_CHANCE = 0.5;
  export const MOVING_GAP_AMPLITUDE = 90;
  export const NORMAL_MOVING_GAP_CYCLE_SECONDS = 2.4;
  export const WARNING_MOVING_GAP_CYCLE_SECONDS = 1.6;
  export const SPECIAL_TIMING_GUIDE_COUNT = 5;

  export function shouldSpawnMovingGap(rng, difficulty);
  export function createObstacle(options);
  export function updateObstacle(obstacle, deltaSeconds, speed, elapsedSeconds);
  ```
- **Data Fields**:
  - `difficulty.movingGapChance`: `0` before score 50, `0.5` at/after score 50.
  - `player.dashKind`: `'none' | 'normal' | 'special'`; initial and finished value `'none'`.
  - `player.dashTargetId`: `string | null`; non-null only for a successful special dash.
  - `obstacle.width`: `24` for special, existing `OBSTACLE_WIDTH` for normal.
  - `obstacle.showTimingGuide`: boolean, true only for special numbers 1 through 5 in a run.
  - Moving normal-only fields: `movingGap` boolean; `baseGapCenter` number; `gapMotionPhase` radians; `gapMotionAmplitude` 90 or 0; `gapMotionCycleSeconds` 2.4/1.6 or null; `gapCenter` current clamped center.
- **Execution Flow / Logic**:
  1. Retain existing score normalization. Set special chance to zero through score 14 and existing normal/WARNING probabilities from score 15 onward. Set moving chance to zero through score 49 and 0.5 from score 50 onward.
  2. `createObstacle` gives specials width 24 and forces `movingGap` false. Normal obstacles retain 72px width. Clamp every base/current gap against `gapHeight` and world height.
  3. A moving obstacle recomputes `gapCenter` on each update as `baseGapCenter + amplitude * sin(2π * elapsedSeconds / cycle + phase)`, then clamps. Invalid elapsed/motion values must retain the previous valid center instead of producing `NaN`.
  4. Use a per-obstacle RNG-derived phase. Spawn-time difficulty chooses 2.4 seconds in normal mode or 1.6 seconds in WARNING/BOSS; a wall keeps that chosen period.

### I02. Integrate spawning, anytime dash, strict collision, and guide metadata

- Related Files:
  - `src/game/collision.js` :: `intersectsPlayerObstacle`, `startDash`, `advanceDash`; modify
  - `src/game/game-engine.js` :: `start`, `spawnObstacle`, `update`, `dash`, snapshot; modify
  - `tests/game/collision.test.js` :: dash target regressions; modify
  - `tests/game/game-engine.test.js` :: deterministic engine scenarios; modify

#### Details

- **Signatures**:
  ```js
  export function startDash(player, durationSeconds, obstacleId = null, dashKind = 'normal');
  ```
- **Execution Flow / Logic**:
  1. `start()` resets `specialsSpawnedThisRun` to zero alongside existing session state. `spawnObstacle` selects special/normal first; only normals roll `shouldSpawnMovingGap` and consume moving-gap phase RNG. Existing WARNING/BOSS forced-special minima remain unchanged.
  2. When a special is created, increment the run count and pass `showTimingGuide: specialsSpawnedThisRun <= 5`. Never remove this flag when an obstacle passes; the object lifecycle already removes passed walls.
  3. `dash()` returns false only outside `PLAYING`. During play it always starts `DASH_DURATION_SECONDS`. It selects the nearest eligible special ahead of the player; if `isSpecialTimingSuccess` is true, start `'special'` dash with that exact ID; otherwise start `'normal'` dash with null target.
  4. Collision immunity is exact: a special wall is ignored only if `isDashing`, `dashKind === 'special'`, a non-null `dashTargetId` exists, and it equals that obstacle's ID. A normal dash, a null target, a different special target, and every normal/moving wall collide as usual.
  5. Pass accumulated `elapsedSeconds` to each `updateObstacle` before collision checks. Snapshots expose all new player and obstacle fields through the existing shallow-copy behavior.
  6. `advanceDash` clears active state, target ID, and kind when duration expires.
- **Test Scenarios**:
  - Score 14/15 and 49/50 eligibility boundaries; special width 24 and normal width 72.
  - First special after score 15 is full-height collision without timing success; correct timing creates only exact-target immunity.
  - Space with no/early special starts normal dash and still dies on special and normal collisions; this guards the prior null-target bypass risk.
  - Moving normal gaps stay bounded, vary with elapsed time, use 2.4 normal / 1.6 WARNING-BOSS period, and never attach to special walls.
  - Every `start()` marks specials 1–5 true and 6+ false; WARNING retains at least two specials and BOSS at least three.

## Acceptance Criteria

- [ ] Thin 24px special walls begin at score 15, including the first, and only their successful timed dashes permit passage.
- [ ] Normal walls alone gain 50%-eligible bounded sinusoidal gaps from score 50 with approved periods.
- [ ] Space always produces runtime dash state during play without granting unintended collision immunity; first-five guide metadata resets per run.

## Validation

- `npm run test -- --run tests/game/difficulty.test.js tests/game/obstacles.test.js tests/game/collision.test.js tests/game/game-engine.test.js`
- `npm run test -- --run`
- `npm run build`

## Commit Message

```text
feat(game): integrate refined obstacle and dash runtime

Plan: 2026-09-22-gameplay-experience-refinements
Phase: P01-integrated-experience
Task: T01-gameplay-runtime

- add fair thin specials and moving-gap wall rules
- support safe anytime dashes and early timing-guide state
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending

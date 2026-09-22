# Task: T01 Dash Feedback

## Status: pending

## Goal

Space starts a short visual dash at any point during active play. Only a correctly timed dash aimed at a special wall grants immunity to that exact wall; every run visually teaches the timing window for its first five special walls and confirms a successful pass with a ring burst and stronger trail.

## Decision Summary

- A normal dash has a short trail only. A timing-successful special dash has the same trail plus a teal expanding ring while the dash is active.
- The first five `special` obstacles created after every `engine.start()` carry a guide flag. Their renderer-only guide is a translucent teal vertical band immediately to the left (the approaching side) of the wall, with width `scrollSpeed * timingWindowSeconds`.

## Implementation

### I01. Separate visual dash state from special-wall immunity

- Related Files:
  - `src/game/player.js` :: `createPlayer`; modify
  - `src/game/collision.js` :: `intersectsPlayerObstacle`, `startDash`, `advanceDash`; modify
  - `src/game/game-engine.js` :: `start`, `dash`, obstacle spawn metadata, snapshot; modify
  - `tests/game/collision.test.js` :: targeted-immune and ordinary-dash cases; modify
  - `tests/game/game-engine.test.js` :: dash and first-five-special state cases; modify

#### Details

- **Signatures & Types**:
  ```js
  export function startDash(player, durationSeconds, obstacleId = null, dashKind = 'normal');

  // Player fields added by createPlayer and exposed through getSnapshot().player
  // dashKind: 'none' | 'normal' | 'special'
  // dashTargetId: string | null
  // dashRemainingSeconds: number
  // isDashing: boolean
  ```
- **Data & Schema Fields**:
  - `player.dashKind`: `'none'` while inactive, `'normal'` for a free Space dash, and `'special'` only after the timing check succeeds against a selected special obstacle.
  - `player.dashTargetId`: string ID of the passed special obstacle only for `dashKind === 'special'`; `null` for normal dashes and inactive state.
  - `obstacle.showTimingGuide`: boolean. `true` only for the first five special obstacles spawned since the most recent `engine.start()`; false for normal walls and later special walls.
  - Engine-private `specialsSpawnedThisRun`: non-negative integer reset to zero by `start()`. Increment it exactly once whenever a special obstacle is created, including forced WARNING/BOSS specials.
- **Execution Flow / Logic**:
  1. Preserve the existing `DASH_DURATION_SECONDS`; `dash()` returns `false` only when game state is not `PLAYING`. In active play, it always calls `startDash` and returns `true`.
  2. Select the nearest unpassed special obstacle at or ahead of the player exactly as the current code does. If it is within `isSpecialTimingSuccess`, set its ID as `dashTargetId` and call `startDash(..., 'special')`; otherwise start a normal dash with null target and `'normal'` kind.
  3. Tighten special-wall collision immunity. Return no collision only when all conditions hold: `player.isDashing`, `player.dashKind === 'special'`, `player.dashTargetId` is non-null, and it equals `obstacle.id`. Never treat a null target as immunity. Normal/moving normal obstacles must always retain collision.
  4. `advanceDash` decrements duration as before. When it reaches zero, set `isDashing` false, `dashRemainingSeconds` zero, `dashTargetId` null, and `dashKind` `'none'`.
  5. In `spawnObstacle`, after kind selection, increment the per-run special counter only for special obstacles and pass `showTimingGuide: specialsSpawnedThisRun <= 5` to that obstacle. Normal walls receive false. Do not couple this teaching count to the WARNING guarantee set or passed-obstacle cleanup.
- **Error & Exception Handling**:
  - Preserve inactive-state behavior: menu, tutorial, paused, and game-over calls never mutate player dash state.
  - Unknown dash-kind input normalizes to `'normal'` when a dash begins; collision immunity must still require the literal `'special'` kind.
- **Test Scenarios**:
  - A normal dash can start with no nearby special wall and returns success during `PLAYING`, but collides with both normal and special obstacles.
  - A timing-successful special dash has `dashKind: 'special'`, records only that wall ID, and passes only that wall; a concurrent/different special still collides.
  - A normal dash has a null target and cannot exploit the previous null-target immunity condition.
  - `engine.start()` resets the special counter. First through fifth specials have `showTimingGuide: true`; sixth and later specials are false.

### I02. Draw dash trails, success ring bursts, and timing bands from snapshots

- Related Files:
  - `src/game/renderer.js` :: `drawShip`, `drawObstacle`, new local effect helpers; modify
  - `src/game/visual-theme.js` :: optional named teal feedback colors/opacity constants; modify only if renderer needs them
  - `tests/game/renderer.test.js` :: canvas-spy assertions; modify

#### Details

- **Execution Flow / Logic**:
  1. Before drawing the ship, draw a short fading trail when `player.isDashing`; derive its length and opacity from `dashRemainingSeconds / DASH_DURATION_SECONDS` without retaining renderer state. Normal and special dashes both show it.
  2. When `player.isDashing && player.dashKind === 'special'`, draw a teal circular ring centered on the player. Its radius expands from roughly the ship width to three times that width as dash progress advances, and its alpha fades to zero before dash expiry. Do not draw a ring for normal dashes.
  3. For `obstacle.kind === 'special' && obstacle.showTimingGuide`, calculate `guideWidth = max(0, snapshot.difficulty.scrollSpeed * snapshot.difficulty.timingWindowSeconds)`. Draw a translucent teal full-height vertical rectangle from `obstacle.x - guideWidth` to `obstacle.x`, then the existing special wall. Do not draw a guide for normal walls or sixth-and-later specials.
  4. Update `render(snapshot)` to pass the current `snapshot.difficulty` to obstacle drawing. Rendering must remain safe for existing tests/snapshots with a missing difficulty object: use a zero-width/no-op guide in that case.
- **Test Scenarios**:
  - Normal active dash generates trail drawing but no ring path.
  - Successful special dash generates both trail and ring drawing.
  - A guide-enabled special wall draws the expected band before its wall using speed × timing-window width; an unflagged special wall does not.
  - Existing normal gap, full-height special, boss, and WARNING render tests remain valid.

## Acceptance Criteria

- [ ] Active-play Space always starts a visible dash, but ordinary dashes never bypass any obstacle.
- [ ] A correct special-wall dash is immune only to its exact target and visibly produces a teal ring plus trail.
- [ ] Each run displays an accurate timing band for exactly its first five special walls.

## Validation

- `npm run test -- --run tests/game/collision.test.js tests/game/game-engine.test.js tests/game/renderer.test.js` — dash state, collision, guide, and canvas effects pass.
- `npm run test -- --run` — full suite passes.
- `npm run build` — production build succeeds.

## Commit Message

```text
feat(game): add dash feedback and timing guides

Plan: 2026-09-22-menu-dash-feedback
Phase: P01-feedback-and-menu
Task: T01-dash-feedback

- allow harmless anytime dashes with visual trails
- guide early special-wall timing and confirm successful dashes
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

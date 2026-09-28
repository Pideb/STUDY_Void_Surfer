# Task: T04 Scrolling Backgrounds

## Status: done

## Goal
Replace the current subtle 150-second crop oscillation with persistent right-to-left stage-background travel. Keep backgrounds moving at 25% of the current gameplay wall speed, wrap them with a short overlap crossfade, and move a newly selected stage scene from the right at the current wall speed.

## Decision Summary
- Ambient stage-art speed is `snapshot.difficulty.scrollSpeed * 0.25` and is presentation-only.
- Integrate traveled pixels from simulation delta so speed changes do not cause position jumps.
- Stage transition covers one world width and advances at the same current speed as obstacles.
- Preserve reduced-motion handling and creation-time stage art on obstacles.

## Implementation

### I01. Simulation distances in the snapshot
- Related Files:
  - `src/game/game-engine.js` :: `createGameEngine` state, `start`, `update`, `advanceStage`, `updateStage`, and `getSnapshot`; modify.
  - `tests/game/game-engine.test.js`; modify.

#### Details
- Add internal `backgroundScrollDistancePx`, initialized/reset to `0`; on each active simulation update integrate `difficulty.scrollSpeed * deltaSeconds * 0.25` and normalize only for numeric safety (renderer wraps it for the scene).
- Add `backgroundScrollDistancePx` to the top-level game snapshot as a finite nonnegative number. It must not affect difficulty or gameplay state.
- Make transition travel distance explicit in `stage.transition` (e.g. `travelledPixels`, initially `0`) and advance it by `difficulty.scrollSpeed * deltaSeconds`; set `progress = clamp(travelledPixels / WORLD_WIDTH, 0, 1)`.
- Calculate current difficulty before integrating background/transition distances so velocity uses the speed for that simulation frame, including aircraft and boss multipliers.
- Test exact distance deltas at baseline speed 240: ambient distance increases by 60 px/s, stage-transition distance by 240 px/s. Test that velocity changes affect the next delta without resetting accumulated distance.

### I02. Seam-softened scene renderer
- Related Files:
  - `src/game/renderer.js` :: `drawStageArtwork`, `drawStageBackground`, `drawBackgroundTransition`, and `createRenderer().render`; modify.
  - `tests/game/renderer.test.js`; modify.

#### Details
- Pass `backgroundScrollDistancePx` and current `scrollSpeed` from `render(snapshot)` to background drawing. Do not use `stage.elapsedSeconds` for the movement phase because it resets at stage changes.
- Scroll background art only leftward. Reuse the existing 12% overscan/crop or equivalent repeated-scene coverage, and blend overlapping scene copies over a short wrap interval (target 0.35 s) so resetting the source image phase does not produce a hard seam. Avoid a visible center-origin reveal.
- For stage transitions, derive horizontal displacement from `transition.travelledPixels`, clip to the world viewport, draw old scene moving off left and new scene entering from right. New scene x offset is `WORLD_WIDTH - travelledPixels`; old scene x offset is `-travelledPixels`. Clamp when transition ends.
- Keep transition speed tied to current `difficulty.scrollSpeed`; do not use a fixed 1.5-second interpolation for normal motion. Under reduced motion, retain the existing short crossfade instead of spatial travel.
- Keep the existing dark readability overlay on each complete scene and preserve the boss-background key selection.
- Tests assert offset direction/wrap continuity (within fade), new-scene right-to-left entry, movement distance following speed, reduced-motion crossfade, and no draw for unowned background IDs beyond existing fallback.

## Acceptance Criteria
- [x] Background moves continuously right-to-left at 25% of wall travel in normal and boss modes.
- [x] Looping has no abrupt position reset; the wrap uses an overlap crossfade.
- [x] Stage transition enters from the right at wall speed and does not originate in the center.
- [x] Reduced-motion preference avoids continuous/spatial movement.

## Validation
- `npm test -- --run tests/game/renderer.test.js tests/game/game-engine.test.js` — all 45 tests pass.
- `npm run build` — production build passes.

## Commit Message
```text
feat(render): scroll and loop stage backgrounds with gameplay

Plan: 2026-09-28-gameplay-visual-polish
Phase: P02-visual-motion
Task: T04-scrolling-backgrounds

- Integrate background travel at one quarter of wall speed
- Slide stage scenes at wall speed and soften loop seams
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

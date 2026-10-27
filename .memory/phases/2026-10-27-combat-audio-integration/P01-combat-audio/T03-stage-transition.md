# Task: T03 Wall-speed scene boundary and spawn suspension

## Status: done

## Goal
Wall-speed scene boundary and spawn suspension; apply the approved combat/audio review with deterministic state and regression coverage.

## Decision Summary
User approved all previews and requested autonomous continuation. Existing laser fairness and scoring rules remain in force. Implementation baselines are recorded in the decision document.

## Implementation
### I01. Transition geometry and spawning
- `src/game/renderer.js::drawBackgroundTransition`: old and new backgrounds remain in screen coordinates with normal .25x texture scroll; reveal new scene from right to left through a boundary `WORLD_WIDTH - travelledPixels`, rather than translating scenes on top of their own scrolling. Blend a narrow soft boundary with adjacent clipped strips. Old left/new right stay in place, no center-origin reveal, no empty canvas. Reduced-motion crossfade uses full transition progress rather than .15s shortcut.
- `src/game/game-engine.js::updateStage/update`: retain `travelledPixels += current wall speed*dt`, exactly one screen of travel. While transition active, pause new spawns AND accumulation; preserve existing moving walls and per-wall stageId. Resume with one right-edge spawn opportunity after completion, not a delayed burst. Delay new warning/boss preview during transition so its counters do not begin in an empty suspended wave.
- `tests/game/game-engine.test.js`: trigger boss clear+two passed walls, verify travelled delta=wall speed*dt, no fresh obstacle IDs while transition, existing stageId invariant, bounded resume; cover Velocity/restart.
- `tests/game/renderer.test.js`: new right/old left clipping geometry at0/.5/1, no translated scene motion; reduced-motion respects complete progress.

## Acceptance Criteria
- [x] All behaviors and fields described above implemented.
- [x] Focused regressions pass; no stale async state, paused clocks or collision/render mismatch.
- [x] Production build and whitespace checks pass.

## Validation
- `npm test -- --run tests/game/game-engine.test.js tests/game/renderer.test.js`
- `npm run build`
- `git diff --check`

## Commit Message
```text
feat(game): wall-speed scene boundary and spawn suspension

Plan: 2026-10-27-combat-audio-integration
Phase: P01-combat-audio
Task: T03-stage-transition
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- Validation: 86 focused tests/build passed; default and Velocity transitions suspend spawns and resume once.
- commit: `03fb7a2`

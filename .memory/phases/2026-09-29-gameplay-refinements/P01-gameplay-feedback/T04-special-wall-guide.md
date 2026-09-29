# Task: T04 Improve Special-Wall Timing Guide Visibility

## Status: pending

## Goal
Make the first-run special-wall timing window easy to perceive while keeping every guide pixel aligned with the actual existing dash-success window.

## Decision Summary
- Retain guide visibility until the first BOSS is cleared.
- Strengthen the band with bright translucency, exact boundary lines, and an approach pulse without changing judgment rules.

## Implementation

### I01. Render an exact-width, high-contrast timing guide
- Related Files:
  - `src/game/renderer.js` :: `getTimingGuideWidth`, `drawObstacle`; add `drawSpecialTimingGuide` or equivalent. Keep `width = max(0, difficulty.scrollSpeed * difficulty.timingWindowSeconds)`.
  - `src/game/game-engine.js` :: `spawnObstacle`; preserve `showTimingGuide = kind === 'special' && !firstBossCleared` and provide render timing through existing difficulty snapshot if needed.
  - `tests/game/renderer.test.js` :: assert band and edge coordinates match width; assert visible alpha/glow and approach pulse states.
  - `tests/game/game-engine.test.js` :: retain guide lifetime through first boss and hiding on later new specials.

#### Details
- Band stays at `[obstacle.x - width, obstacle.x]` across the playfield height. Do not add padding or move either edge.
- Raise fill opacity from current 0.18 to a readable 0.35–0.45, draw 2px bright boundary lines at both exact x coordinates, and add restrained stage-independent glow.
- Pulse as the wall approaches: derive normalized progress from `obstacle.x`, player x, and displayed guide width; use deterministic phase from `difficulty.elapsedSeconds`. Keep alpha nonzero at every phase.
- Under reduced motion, keep a static bright band/edges. Do not change `isSpecialTimingSuccess`, timing window, dash targeting, collision bounds, wall dimensions, or spawn timing.

## Acceptance Criteria
- [ ] Guide width remains exactly `scrollSpeed × timingWindowSeconds`.
- [ ] Band and boundaries are readable against all stage backgrounds.
- [ ] Approach pulse works and reduced motion displays a static guide.
- [ ] Availability and actual gameplay judgment are unchanged.

## Validation
- `npm test -- --run tests/game/renderer.test.js tests/game/game-engine.test.js`
- `git diff --check`

## Commit Message
```text
fix(render): clarify special-wall dash timing window

Plan: 2026-09-29-gameplay-refinements
Phase: P01-gameplay-feedback
Task: T04-special-wall-guide

- Add high-contrast timing bands and approach pulse
- Keep guide bounds identical to the dash judgment window
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

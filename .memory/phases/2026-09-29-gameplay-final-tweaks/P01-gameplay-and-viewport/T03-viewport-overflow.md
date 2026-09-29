# Task: T03 Viewport Overflow

## Status: pending

## Goal
Ensure the canvas and UI overlay remain within the available browser viewport on desktop and landscape mobile, without creating offscreen game space or changing the intended full-viewport presentation.

## Decision Summary
- Keep the 960x540 logical game world and stretch it to the viewport; do not introduce letterboxing or portrait-mode gameplay.
- The existing CSS sets `#app` to viewport dimensions and overlays canvas/UI in one grid cell, but does not constrain grid tracks or child min-sizes. Investigate and remove intrinsic minimum-size overflow at the grid boundary.

## Implementation

### I01. Constrain viewport grid and overlay children
- Related files:
  - `src/styles.css` :: `#app`, `.game-canvas`, `.ui-root` — make the grid track and overlaid items shrink to available viewport dimensions; modify.
  - `tests/ui/accessibility.test.js` :: viewport layout test — assert the shrink constraints and retain existing full-viewport/safe-area checks; modify.

#### Details
- Preserve `#app` `width: 100vw`, `height: 100vh`, `height: 100dvh`, `overflow: hidden`, `max-width: none`, and `aspect-ratio: auto`.
- Make the single grid track explicitly shrinkable with `grid-template-columns: minmax(0, 1fr)` and `grid-template-rows: minmax(0, 1fr)`.
- Add `min-width: 0` and `min-height: 0` to the overlaid `.game-canvas, .ui-root` items so the canvas intrinsic/logical size cannot enlarge the grid track.
- Preserve canvas logical rendering size and its current CSS width/height; preserve UI layout and screen-specific alignment.
- Extend the existing viewport test to assert shrinkable grid tracks and min-size resets. Keep assertions for full viewport dimensions, absence of a 960px cap/16:9 frame, and safe-area support.

### I02. Verify full suite and production build
- Related files:
  - `tests/ui/accessibility.test.js` :: viewport regression coverage — validate; read-only after I01.
  - `src/styles.css` :: final responsive viewport behavior — validate; read-only after I01.

#### Details
- Run all unit/integration tests and production build to catch CSS-contract or bundling regressions.
- Confirm `git diff --check` is clean.

## Acceptance Criteria
- [ ] The canvas and UI overlay are constrained by a shrinkable viewport-sized grid track.
- [ ] Existing 100vw/100dvh full-screen behavior and landscape mobile behavior remain intact.
- [ ] Tests/build pass and no unrelated screen layout behavior changes.

## Validation
- `npm test -- --run tests/ui/accessibility.test.js`
- `npm test -- --run`
- `npm run build`
- `git diff --check`

## Commit Message
```text
fix(ui): prevent game viewport overflow

Plan: 2026-09-29-gameplay-final-tweaks
Phase: P01-gameplay-and-viewport
Task: T03-viewport-overflow

- Constrain viewport grid tracks and canvas/UI intrinsic minimum sizes
- Add regression assertions for full-viewport landscape layout
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

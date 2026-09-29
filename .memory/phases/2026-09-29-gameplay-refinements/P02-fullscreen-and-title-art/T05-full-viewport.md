# Task: T05 Fill the Browser Viewport

## Status: pending

## Goal
Use the entire browser viewport on desktop and mobile, stretching the existing 960×540 scene and UI to viewport shape without crop or letterboxing.

## Decision Summary
- Replace the centered max-960px 16:9 app frame with a full viewport rectangle.
- Keep fixed logical world coordinates; CSS scales canvas and UI overlay together.

## Implementation

### I01. Remove the desktop frame constraint and fit viewport dimensions
- Related Files:
  - `src/styles.css` :: `html`, `body`, `#app`, `.game-canvas`, `.ui-root`, and `@media (max-width: 700px)` rules.
  - `src/game/renderer.js` :: `createRenderer().resize`; preserve logical 960×540 backing resolution and device-pixel-ratio transform; remove conflicting rendered aspect-ratio assignment if needed.
  - `tests/ui/accessibility.test.js` :: assert viewport sizing, no max-width/16:9 app constraint, and canvas/UI full bounds.
  - `tests/game/renderer.test.js` :: preserve logical coordinate and HiDPI contract.

#### Details
- Page/root dimensions use `100vw` and `100vh` fallback then `100dvh`. `#app`: width 100vw, height 100vh then 100dvh, no max-width, no aspect ratio, no outer radius/border that creates a frame.
- `.game-canvas` and `.ui-root` share the same grid area and both use width/height 100%. Set canvas `aspect-ratio: auto`; do not change internal 960×540 world coordinates or pixel-ratio backing store.
- Remove/override mobile rules that restore a framed aspect ratio. Preserve responsive HUD/touch control layouts and safe-area padding.
- No Fullscreen API, crop, letterboxing, or camera/world change. Non-16:9 stretching is intentional.

## Acceptance Criteria
- [ ] Desktop viewport has no unused app margin or 960px cap.
- [ ] Mobile fills the dynamic viewport without letterbox bars.
- [ ] Canvas and UI overlay stretch together; logical coordinates/HiDPI remain intact.
- [ ] Touch actions remain usable within safe areas.

## Validation
- `npm test -- --run tests/ui/accessibility.test.js tests/game/renderer.test.js`
- `git diff --check`

## Commit Message
```text
feat(ui): fill desktop and mobile game viewport

Plan: 2026-09-29-gameplay-refinements
Phase: P02-fullscreen-and-title-art
Task: T05-full-viewport

- Stretch the game canvas and UI over the browser viewport
- Preserve logical gameplay coordinates and mobile safe areas
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

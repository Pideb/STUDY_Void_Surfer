# Task: T06 Title Aircraft Preview

## Status: done

## Goal
Replace the title menu's text-only selected-aircraft status with a larger visual preview of the aircraft the player actually selected, including a slow float and subtle rear exhaust glow.

## Decision Summary
- Use existing `VISUAL_ASSET_MANIFEST.aircraft` assets and the selected aircraft ID from app state.
- Render a DOM preview over the existing menu canvas, so CSS can animate it without starting a second canvas loop.
- Keep the menu responsive and obey reduced-motion preference.

## Implementation

### I01. Pass selected aircraft and render preview
- Related Files:
  - `src/ui/app-controller.js` :: `paint()` menu branch and `SELECT_AIRCRAFT`/return-to-menu behavior; modify.
  - `src/ui/screens.js` :: `renderMenuScreen`; modify.
  - `src/styles.css` :: `.menu-screen`, `.menu-aircraft-status`, new preview/exhaust classes and reduced-motion rules; modify.
  - `src/game/renderer.js` :: `renderMenuBackground`; remove its fixed default-ship drawing to avoid duplicate aircraft; modify.
  - `tests/ui/screens.test.js`, `tests/ui/app-controller.test.js`, `tests/ui/accessibility.test.js`, `tests/game/renderer.test.js`; modify.

#### Details
- Add `selectedAircraftId` to the model passed by `app-controller.js`; retain the readable selected aircraft name for an accessible label/status if useful.
- In `renderMenuScreen`, create a preview wrapper with `img` using `VISUAL_ASSET_MANIFEST.aircraft[selectedAircraftId]` (fallback to `.default`), plus a decorative exhaust element. The image is `alt=""` and `aria-hidden="true"`; provide a screen-reader-readable aircraft name in a status or wrapper label.
- Make the displayed aircraft visibly larger than the current fixed 72×48 menu ship (target image box about 144×96 logical-canvas-equivalent CSS size, responsive down on narrow viewports). Keep menu actions and logout clickable and unobscured.
- Apply CSS keyframes for a slow vertical float (roughly 3-second cycle, 6–10 px range) and subtle short exhaust glow behind the ship. Match the selected aircraft's existing CSS/color class (default, velocity, aegis); do not use text glyphs as the ship.
- Add `@media (prefers-reduced-motion: reduce)` to disable the float/pulse while leaving the static preview and faint exhaust visible.
- Remove the static default aircraft from `renderer.renderMenuBackground()` so only the selected DOM preview is shown.
- Tests verify each selected ID resolves to the matching local PNG and aircraft selection persists back to the menu; tests verify no duplicate default ship is drawn and menu controls remain accessible.

## Acceptance Criteria
- [x] Title screen shows the currently selected aircraft art, not only its name.
- [x] Preview is visibly larger, gently floats, and has a faint rear exhaust glow.
- [x] Changing aircraft updates the title preview immediately after returning from the hangar.
- [x] Menu actions/logout remain reachable; reduced-motion preference disables animation.

## Validation
- `npm test -- --run tests/ui/screens.test.js tests/ui/app-controller.test.js tests/ui/accessibility.test.js tests/game/renderer.test.js` — all 47 tests pass.
- `npm run build` — production build passes.

## Commit Message
```text
feat(ui): show selected aircraft on title screen

Plan: 2026-09-28-gameplay-visual-polish
Phase: P02-visual-motion
Task: T06-title-aircraft-preview

- Add selected-aircraft artwork with float and exhaust effects
- Remove the hard-coded default menu ship
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

# Task: T01 Menu and Background

## Status: done

## Goal
Ensure the main-menu logout button fits inside the game frame on desktop, and make gameplay backgrounds easier to read while subtly flowing with the stage direction.

## Decision Summary
- Keep logout in its separate account-actions row; reduce desktop vertical spacing/padding so the row remains inside the clipped 16:9 frame.
- Darken gameplay artwork modestly and pan the whole scene slowly right-to-left with reduced-motion support.

## Implementation
### I01. Main-menu layout
- Related Files:
  - `src/styles.css` :: `.menu-overlay`, `.account-actions`, and mobile rules; modify
- Details:
  - Keep the current two-column desktop structure and separate third-row logout placement.
  - Reduce desktop vertical padding and row gap enough for the brand, all menu controls, and logout button to fit within the 540px logical canvas. Keep a visibly larger gap/divider before logout than between primary actions.
  - Preserve the mobile one-column layout, its scrolling behavior, and touch-sized controls.

### I02. Gameplay background treatment
- Related Files:
  - `src/game/renderer.js` :: `drawStageBackground`, `drawBackgroundTransition`; modify
- Details:
  - Use a shared background draw helper for both static stage rendering and transition scenes, so both receive the same visual treatment.
  - For loaded stage art, draw with slight overscan and a slow bounded horizontal drift corresponding to right-to-left movement; add only subtle vertical parallax. Avoid exposing blank canvas edges.
  - Add a low-opacity dark overlay after drawing the background art to improve player/obstacle contrast; keep Warning/Boss atmosphere overlays separate and in their existing order.
  - When `prefers-reduced-motion` is active, disable continuous pan while retaining the stage transition's existing reduced-motion behavior.
  - Keep procedural background fallback behavior and all gameplay entities/collision unchanged.

## Acceptance Criteria
- [x] Logout remains a distinct account action and is visible within desktop and mobile game frames.
- [x] Gameplay art is slightly dimmer, drifts subtly right-to-left, and does not expose blank edges.
- [x] Reduced-motion users do not receive continuous background pan.

## Validation
- `npm run build`
- Inspect desktop/mobile CSS geometry and background draw bounds; do not run the automated test suite unless the user asks for testing.

## Commit Message
```text
fix(ui): keep logout visible and improve gameplay backdrop

Plan: 2026-09-28-menu-score-background-reliability
Phase: P01-reliability-fixes
Task: T01-menu-and-background

- fit separated logout row within the game frame
- dim and gently pan stage backgrounds
```

## Progress
- [x] Implementation complete
- [x] Build validation passed: `npm run build`
- commit: pending

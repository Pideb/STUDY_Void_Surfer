# Task: T02 Playfield UI

## Status: pending

## Goal

Render the refined obstacle state clearly and keep desktop gameplay free of clickable HUD controls, while preserving mobile touch controls and accessibility labels.

## Decision Summary

- The ship becomes white while normal walls retain teal. Special walls keep their distinct purple/orange styling and render at the model-provided 24px width.
- Every button within the in-play `.game-hud` is hidden on desktop widths. Mobile layouts continue to show the existing mute, pause, and touch `SPACE` controls.

## Implementation

### I01. Update playfield rendering and visual theme

- Related Files:
  - `src/game/visual-theme.js` :: `VISUAL_THEME.ship`, existing obstacle colors; modify
  - `src/game/renderer.js` :: `drawObstacle`; modify only if needed to make moving-gap rendering explicit while keeping current model-driven coordinates
  - `tests/game/renderer.test.js` :: player/normal/special/moving wall draw assertions; modify

#### Details

- **Execution Flow / Logic**:
  1. Change `VISUAL_THEME.ship` to a clearly white value while keeping its teal accent and glow behavior. Keep `VISUAL_THEME.obstacle` teal so player and ordinary obstacles no longer share the same primary hue.
  2. `drawObstacle` must continue to derive normal wall solids from the obstacle's current `gapCenter` and `gapHeight`; it must not cache or independently animate a gap. This ensures moving-gap collision and visuals use identical geometry.
  3. Special obstacles still draw as full-height dash-only barriers and use `obstacle.width`; do not reintroduce a gap or hard-code the old 72px width.
- **Test Scenarios**:
  - Theme assertion confirms the player primary color differs from the normal obstacle primary color.
  - A moving normal obstacle with a supplied current `gapCenter` renders top and bottom solids around that value.
  - A 24px special obstacle renders as one full-height rectangle and retains its special accent treatment.

### I02. Hide desktop HUD buttons without removing mobile interaction

- Related Files:
  - `src/styles.css` :: `.game-hud button`, `.mobile-space-button`, desktop and mobile media queries; modify
  - `src/ui/game-hud.js` :: `createGameHud`; read-only unless a selector or accessibility hook needs a minimal adjustment
  - `tests/ui/accessibility.test.js` :: control labels and stylesheet selectors; modify
  - `tests/integration/mobile-input.test.js` :: mobile `SPACE` touch behavior; modify if responsive assertions require it

#### Details

- **Execution Flow / Logic**:
  1. Keep the existing DOM controls and handlers so keyboard input, pause behavior, mute state, and mobile handlers are unchanged.
  2. At desktop widths (above the existing 700px mobile breakpoint), apply `display: none` to every `.game-hud button`, covering mute, pause, and the `SPACE` button. The desktop HUD may still show score and WARNING/BOSS text.
  3. Inside the existing `@media (max-width: 700px)` block, explicitly restore interactive display for `.game-hud button` and retain `.mobile-space-button { display: block; }`. Do not hide controls on phones or tablets classified by this breakpoint.
  4. Preserve `.game-hud { pointer-events: none; }` and the mobile button `pointer-events: auto` behavior. Do not alter canvas click/tap lift handling.
- **Test Scenarios**:
  - Styles contain a desktop rule hiding all HUD buttons and a mobile override that restores them.
  - Existing mobile `SPACE` click continues to call dash and successful dashes still play feedback only on success.
  - Every created HUD button retains a non-empty visible label or `aria-label`, even when hidden by a desktop visual rule.

## Acceptance Criteria

- [ ] Player and normal walls have visibly different primary colors; normal and moving gaps render from the engine's current geometry.
- [ ] Special walls visibly use their 24px model width and remain full-height.
- [ ] Desktop play HUD exposes no clickable buttons, while mobile mute, pause, and `SPACE` controls remain usable.

## Validation

- `npm run test -- --run tests/game/renderer.test.js tests/ui/accessibility.test.js tests/integration/mobile-input.test.js` — renderer, responsive-control, and mobile-input coverage passes.
- `npm run test -- --run` — full suite passes.
- `npm run build` — production build succeeds.

## Commit Message

```text
feat(ui): refine playfield contrast and desktop controls

Plan: 2026-09-22-gameplay-refinements
Phase: P01-runtime-and-ui-refinements
Task: T02-playfield-ui

- distinguish the player from normal walls
- hide desktop play HUD controls while preserving mobile input
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

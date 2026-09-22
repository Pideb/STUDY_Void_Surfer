# Task: T03 Center Game Card Panels

## Status: done

## Goal

Ensure every reusable in-game card panel is geometrically centred inside the 16:9 game viewport at every supported screen size. This includes loading, login, tutorial, pause, and game-over panels, while leaving the intentionally full-screen menu overlay and absolute gameplay HUD unaffected.

## Decision Summary

- Centre all elements using the shared `.screen-panel` class horizontally and vertically in the `.ui-root` viewport.
- Do not change panel content, button actions, responsive dimensions, the menu overlay, or gameplay HUD controls.

## Implementation

### I01. Establish a shared panel-centering layout context

- Related Files:
  - `src/styles.css` :: `.ui-root`, `.screen-panel`, mobile media rules; modify
  - `tests/ui/accessibility.test.js` :: responsive CSS contract test; modify

#### Details

- Make `.ui-root` a full-size CSS grid container with `display: grid` and `place-items: center`. It already shares the game viewport grid area and has explicit width/height, so this centres normal-flow child panels in both axes.
- Retain `.ui-root { position: relative; pointer-events: none; }` and the existing `.ui-root > * { pointer-events: auto; }` rule. Do not alter canvas stacking order.
- Keep `.screen-panel` width, max-height, overflow, padding, border, background, and `align-self`/`justify-self` rules. These elements must now receive effective centring from the grid parent.
- Ensure `.game-hud` remains `position: absolute; inset: 0` and `.menu-overlay` remains `position: absolute; inset: 0`; absolute children must not consume grid placement or move away from their current full-playfield layouts.
- Preserve the existing `@media (max-width: 700px)` panel width/padding and mobile HUD control rules.
- Add static stylesheet assertions that `.ui-root` declares grid centring and existing mobile/safe-area/reduced-motion rules remain present. Do not add a browser screenshot test or alter DOM screen construction for this task.

## Acceptance Criteria

- [ ] Loading, login, tutorial, pause, and game-over cards are centred horizontally and vertically within the game viewport.
- [ ] Menu overlay and gameplay HUD retain their absolute full-screen positioning and interaction behaviour.
- [ ] Existing narrow-screen sizing, safe-area handling, mobile controls, and reduced-motion policy are preserved.

## Validation

- `npm run test -- --run tests/ui/accessibility.test.js tests/ui/screens.test.js` - UI contract tests pass.
- `npm run test -- --run` - complete suite passes.
- `npm run build` - production build completes.

## Commit Message

```text
fix(ui): center game card panels

Plan: 2026-09-22-warning-difficulty-feedback
Phase: P01-warning-difficulty-feedback
Task: T03-center-game-panels

- center shared screen panels through the UI root layout
- retain full-screen menu and gameplay overlays
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending

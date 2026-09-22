# Task: T02 Canvas Visuals

## Status: pending

## Goal

Render all T01 gameplay state consistently: a white player versus teal normal walls, thin special barriers, moving gaps at their collision positions, normal dash trails, successful-dash ring bursts, first-five timing zones, and a dedicated static menu space scene.

## Decision Summary

- The Canvas renderer is the single visual consumer of runtime `gapCenter`, `dashKind`, and `showTimingGuide`; it must not duplicate physics or retain effect state.
- Menu uses only Canvas 2D primitives—star field, blue/purple soft nebula, depth lines, stationary ship—so no external image asset or asynchronous resource is required.

## Implementation

### I01. Apply gameplay contrast and feedback visuals

- Related Files:
  - `src/game/visual-theme.js` :: ship primary and feedback color values; modify
  - `src/game/renderer.js` :: `drawShip`, `drawObstacle`, render helpers; modify
  - `tests/game/renderer.test.js` :: canvas-spy tests; modify

#### Details

- **Visual Contract**:
  - Set `VISUAL_THEME.ship` to `#ffffff`; retain its teal accent. Keep normal `VISUAL_THEME.obstacle` teal and special purple/orange colors.
  - Normal walls render using only `obstacle.gapCenter` and `gapHeight`, so moving visual gap and collision geometry are identical. Special walls draw one full-height rectangle at their model width.
  - A dash trail is drawn behind the ship whenever `player.isDashing`; its alpha/length derives only from remaining dash duration. When `dashKind === 'special'`, draw an additional fading teal ring centered on the ship, expanding from around one ship width to three ship widths across dash progress. Normal dash draws no ring.
  - A special with `showTimingGuide` receives a translucent teal full-height band directly left of its wall. Its width is `max(0, difficulty.scrollSpeed * difficulty.timingWindowSeconds)` and it is drawn before the wall. Missing difficulty safely yields no guide.
- **Test Scenarios**:
  - Player and normal primary colors differ; normal and special wall geometry remains valid.
  - A supplied moving-wall `gapCenter` controls top/bottom draw placement.
  - Normal active dash produces trail calls but no ring; special active dash produces both; inactive ship produces neither.
  - Guide-enabled special draws a band of exact expected width before wall; unflagged special draws none.

### I02. Add deterministic menu-scene renderer API

- Related Files:
  - `src/game/renderer.js` :: `createRenderer` returned API and menu helpers; modify
  - `tests/game/renderer.test.js` :: menu drawing coverage; modify

#### Details

- **Signature**:
  ```js
  createRenderer(canvas) // returns { resize, render, renderMenuBackground, destroy }
  ```
- **Execution Flow / Logic**:
  1. `renderMenuBackground()` sets the existing pixel-ratio transform, clears/fills world bounds, renders the star field, then draws at least one deterministic radial nebula gradient and subtle depth lines.
  2. Draw a static, centered-left ship using `drawShip` with fixed position, zero velocity, and standard dimensions. No random calls, animation loop, asset loads, or app state are used.
  3. Preserve `render(snapshot)` for gameplay exactly as the animation loop's renderer. Keep resize and destroy behavior unchanged.
- **Test Scenarios**:
  - Menu API exists and emits fill/path/ship-related drawing calls.
  - Existing `render()` snapshots and optional canvas methods remain supported.

## Acceptance Criteria

- [ ] Visual state exactly follows runtime collision state for all walls and dashes.
- [ ] White ship is clearly distinct from teal normal walls; special/timing/dash feedback is visible without external assets.
- [ ] Renderer supplies a deterministic static menu scene while preserving gameplay rendering.

## Validation

- `npm run test -- --run tests/game/renderer.test.js`
- `npm run test -- --run`
- `npm run build`

## Commit Message

```text
feat(game): render refined playfield and menu visuals

Plan: 2026-09-22-gameplay-experience-refinements
Phase: P01-integrated-experience
Task: T02-canvas-visuals

- draw moving gaps and dash timing feedback from runtime state
- add a static VOID SURFER menu canvas scene
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

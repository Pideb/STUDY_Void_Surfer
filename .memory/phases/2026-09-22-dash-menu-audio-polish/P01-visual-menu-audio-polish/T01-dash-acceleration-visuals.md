# Task: T01 Dash Acceleration Visuals

## Status: done

## Goal

Make every dash read as a brief burst of forward acceleration instead of a wide solid rectangle. During both ordinary and special-wall dashes, the player should have a restrained teal outline and pulsing core; the existing special-success ring remains an additional effect rather than replacing the normal dash feedback.

## Decision Summary

- Replace the current solid trail with exactly four short, thin teal lines of differing horizontal lengths and vertical offsets.
- A dash always leaves the line trail. A dashing ship receives a subtle teal outline/glow and an animated core; special-wall success retains its stronger confirmation ring.

## Implementation

### I01. Define reusable dash visual constants

- Related Files:
  - `src/game/visual-theme.js` :: `VISUAL_THEME`; modify

#### Details

- Add a named `dash` visual configuration under `VISUAL_THEME`; do not scatter literal trail measurements through the renderer.
- The configuration must express these values: teal trail colour, line width in canvas pixels, four normalized line definitions (`verticalOffset`, `lengthMultiplier`, `alpha`), ship outline colour, core colour, and a short maximum trail length relative to the ship width.
- Use four entries exactly. Their line lengths must be visibly varied and the longest line must be shorter than the old rectangular trail (target maximum: about 1.25 player widths behind the ship).
- Keep the standard ship fill colour and the existing visual theme fields for walls, special walls, warning, and boss unchanged.

### I02. Render line trails and ship-local dash feedback

- Related Files:
  - `src/game/renderer.js` :: `drawDashTrail`, `drawShip`, and their call sites in the game-frame renderer; modify

#### Details

- Replace the solid `fillRect` dash streak in `drawDashTrail(player, context)` with one stroked horizontal segment per normalized dash-line entry.
- Compute each segment from the ship's rear edge, current `player.width`, and `player.x`/`player.y`. Apply the entry's vertical offset and alpha. Use `beginPath`, `moveTo`, `lineTo`, and `stroke`; restore the canvas context after drawing.
- Draw no dash trail when `player.isDashing` is false. The renderer must not add physics state, timers, or mutate the player object.
- In `drawShip`, retain the normal white ship silhouette. When `player.isDashing` is true, add a narrow teal outline/glow around that silhouette and a small core whose radius or opacity changes deterministically from the renderer's existing animation time/frame time. The effect must be readable but must not obscure obstacle collision boundaries.
- Preserve the existing special-wall success feedback condition and ring. A special-success dash therefore draws: the normal four-line acceleration streak, ship-local effect, and the existing confirmation ring. Normal-wall dashes must never create a special-success ring.
- Preserve rendering behaviour for paused, game-over, warning, boss, mobile, and desktop states.

### I03. Add focused renderer coverage

- Related Files:
  - `tests/game/renderer.test.js` :: dash rendering test cases; modify

#### Details

- Extend the existing canvas-context mock with path and stroke spies if those methods are not already represented.
- Add a dashing-player render scenario with an otherwise empty game state. Assert that exactly four acceleration trail segments are emitted for the dash and that they are strokes, not filled rectangles.
- Add a non-dashing scenario that asserts no acceleration trail path is emitted.
- Keep the current tests which distinguish ordinary dashes from special-success feedback, adding an assertion that the special-success ring is still gated by special-wall success state.

## Acceptance Criteria

- [ ] A normal dash has four short, thin teal acceleration lines and a subtle ship outline/core effect.
- [ ] A special-wall success retains the stronger confirmation ring, while an ordinary dash does not receive that ring.
- [ ] Dash rendering changes no game-engine collision, scoring, obstacle, or timing state.

## Validation

- `npm run test -- --run tests/game/renderer.test.js` - focused renderer tests pass.
- `npm run test -- --run` - the complete test suite passes.
- `npm run build` - production build completes without errors.

## Commit Message

```text
feat(game): polish dash acceleration feedback

Plan: 2026-09-22-dash-menu-audio-polish
Phase: P01-visual-menu-audio-polish
Task: T01-dash-acceleration-visuals

- replace the solid dash bar with four compact acceleration lines
- add a subtle dashing ship glow and animated core
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending

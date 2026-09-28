# Task: T03 Player Exhaust and Scale

## Status: done

## Goal
Make the gameplay aircraft more readable and visibly powered: draw its artwork about 20% larger while keeping all gameplay hitboxes unchanged, leave a short faint glowing exhaust trail during ordinary flight, and remove the rectangular dash hitbox outline.

## Decision Summary
- Logical player and collision dimensions remain `36 × 24` for every aircraft.
- Enlarge only rendered artwork by a factor of 1.2 around the player center.
- Draw a subtle short-lived exhaust behind the ship in normal flight and while dashing; dash-specific acceleration lines remain separate.
- Do not draw `strokeRect` around an image-backed ship during dash.

## Implementation

### I01. Ship rendering and ordinary-flight exhaust
- Related Files:
  - `src/game/renderer.js` :: `drawShip`, `drawDashTrail`, and `createRenderer().render`; modify.
  - `src/game/visual-theme.js` :: `AIRCRAFT_VISUALS`; read-only unless reusing existing per-craft accent colors requires an export adjustment.
  - `tests/game/renderer.test.js`; modify.

#### Details
- **Signatures & Types**:
  - Keep `drawShip(ctx, player, theme = VISUAL_THEME, aircraftId = 'default', visualAssets = null)` compatible, or add an optional elapsed-time input only if deterministic exhaust animation needs it.
  - Add a helper such as `drawShipExhaust(ctx, player, aircraftId, elapsedSeconds, isDashing)` with no mutation to `player` or game snapshot.
- **Rendering geometry**:
  1. For image and procedural branches, retain the same center/rotation and increase fitted `width`/`height` by exactly `1.2` after fitting the image to the logical box. Never alter `player.width`, `player.height`, `PLAYER_WIDTH`, or collision code.
  2. Draw exhaust behind the body before `drawShip()`: three narrow, soft-edged strokes/flame shapes extending toward negative local X (aircraft nose points positive X). Use the selected aircraft's `AIRCRAFT_VISUALS[aircraftId].accent` and its fallback color. Keep opacity low and length short (target 10–18 logical px), with a gentle deterministic pulse rather than persistent particle objects.
  3. Keep existing dash streak effects and special-success burst. The ordinary exhaust must render when `isDashing` is false.
  4. Remove the image-branch `ctx.strokeRect(...)` call. Do not remove ordinary aircraft silhouette outlines or special wall timing visuals.
- **Tests**:
  - Assert image rendering dimensions are 1.2 times the previous fitted dimensions, while engine snapshots remain `36 × 24`.
  - Assert exhaust strokes render during ordinary movement and use a craft accent; verify no exhaust state is written to the player object.
  - Assert the image-backed dash path no longer calls `strokeRect`; retain dash acceleration-line and special burst tests.

## Acceptance Criteria
- [x] Normal gameplay continuously shows a short, faint aircraft-colored exhaust trail.
- [x] Player artwork is visibly 20% larger and remains centered.
- [x] Hitbox dimensions are unchanged and no rectangular hitbox outline appears during dash.
- [x] Existing dashing lines and special-wall success effects still render.

## Validation
- `npm test -- --run tests/game/renderer.test.js tests/game/game-engine.test.js tests/game/collision.test.js` — all 49 tests pass.

## Commit Message
```text
feat(render): add player exhaust and enlarge ship art

Plan: 2026-09-28-gameplay-visual-polish
Phase: P02-visual-motion
Task: T03-player-exhaust-and-scale

- Add a faint aircraft-colored exhaust during regular flight
- Enlarge rendered ship art and remove the dash hitbox rectangle
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

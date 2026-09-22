# Task: T02 Warning Entry and Special-Wall Break Visuals

## Status: done

## Goal

Replace persistent duplicate WARNING text with one short centred HUD announcement per segment entry while retaining a mode-specific playfield atmosphere. Make a successful special dash visibly break the special wall at the ship's crossing height using a punched opening, purple fragments, an enlarged double teal shockwave, and teal sparks.

## Decision Summary

- WARNING and BOSS labels appear in the centre for one second only; BOSS text is exactly `BOSS`.
- The normal WARNING red tint persists while active; BOSS uses a dark/black tint. The Canvas renderer must not render top warning text.
- Success feedback has no screen flash or shake. It uses a double shockwave, ship sparks, and a 0.25-second local wall break.

## Implementation

### I01. Make the HUD entry label stateful and time-bounded

- Related Files:
  - `src/ui/game-hud.js` :: `createGameHud`, its `update(snapshot)` closure state, warning label computation; modify
  - `src/styles.css` :: `.warning-banner`; modify only as needed to preserve centred overlay placement and visual distinction
  - `tests/ui/screens.test.js` :: game HUD warning-banner tests; modify

#### Details

- Keep the existing assertive live region element with class `warning-banner`, but make its visible label depend on a transition rather than on every active difficulty snapshot.
- Within `createGameHud`, track the previous difficulty label (`'normal' | 'warning' | 'boss'`) and `bannerUntilSeconds`.
- In `update(snapshot)`, compute `elapsedSeconds = Number.isFinite(snapshot.elapsedSeconds) ? snapshot.elapsedSeconds : 0`. When the mode changes from normal/warning to `warning` or `boss`, set `bannerUntilSeconds = elapsedSeconds + 1`.
- While `elapsedSeconds < bannerUntilSeconds`, set banner text to exactly `WARNING` for a warning segment and exactly `BOSS` for a boss segment; otherwise set text to `''` and `hidden = true`. Reset the tracked mode on return to normal, but never restart the one-second timer every frame.
- Preserve the score live region and mute-button refresh behaviour. The HUD must remain functional with snapshots used by existing tests that omit `elapsedSeconds`.
- Keep the banner visually centred in the playfield. Do not create a second DOM banner, timers, or `setTimeout`; game elapsed time makes the label deterministic and pauses it naturally when the engine is paused.
- Tests must prove: first warning snapshot displays `WARNING`; it is hidden after elapsed time reaches/exceeds one second; a BOSS transition displays exactly `BOSS`; unchanged snapshots do not extend visibility; and the `aria-live="assertive"` contract remains.

### I02. Render persistent difficulty tints without top text

- Related Files:
  - `src/game/renderer.js` :: replace `drawWarningOverlay` with a tint-only helper and update `render`; modify
  - `src/game/visual-theme.js` :: warning/boss overlay colours or alpha constants; modify
  - `tests/game/renderer.test.js` :: difficulty-overlay assertions; modify

#### Details

- Replace the current renderer helper that both paints a red fill and calls `fillText('WARNING'/'BOSS WARNING', ...)` with a tint-only helper. No Canvas warning or boss label may be drawn.
- For an active non-boss warning, draw one full-world rectangle using the existing warning-red theme colour at a subtle alpha comparable to the current `18` hex alpha (about 9%).
- For an active boss, draw one full-world rectangle using a dark/black theme colour at a subtle but visible alpha. It must replace, not stack with, the red warning tint.
- Keep the boss entity rendering, obstacle rendering, gameplay HUD, pause/game-over drawing, and menu background unchanged.
- Update tests to assert a warning/boss render still produces its tint rectangle but no longer calls `fillText` for `WARNING` or `BOSS WARNING`; retain the boss-pattern label expectation (`BOSS: FAST`).

### I03. Draw special-wall opening, fragments, double shockwave, and sparks

- Related Files:
  - `src/game/renderer.js` :: `drawObstacle`, `drawSpecialDashBurst`, and helper functions; modify
  - `src/game/visual-theme.js` :: named break-effect colours, dimensions, and glow values; modify
  - `tests/game/renderer.test.js` :: break-effect and special-dash render tests; modify

#### Details

- Extend `drawObstacle` to read optional `obstacle.breakEffect`. For a special wall with an effect, calculate `progress = clamp(1 - remainingSeconds / durationSeconds, 0, 1)` only when both duration values are finite and duration is positive.
- Draw the special wall as two full-width vertical segments separated by a local opening centred on `breakEffect.centerY`. The opening half-height must be a named theme value (target about 28 logical pixels) and clamp to world bounds. The opening is visual only: it must not mutate the obstacle model or collision geometry.
- Draw a small, deterministic set of purple fragment strokes/polygons that originate around the opening and travel horizontally left/right as `progress` increases. Fade their alpha to zero by progress 1. Use only Canvas deterministic geometry; do not add physics, random calls, timers, images, or particle state.
- Preserve the ordinary full-height special wall path when no active break effect exists. Preserve timing-guide rendering before the wall and the existing diagonal wall accents where they do not intersect the opening.
- Enhance `drawSpecialDashBurst` for `player.dashKind === 'special'`: draw two teal concentric expanding ring strokes with different radius/alpha/line widths, then a fixed small number of short teal spark lines around the ship. Do not add a screen flash or shake. Normal dashes continue to use only their normal dash trail/ship effect.
- Renderer ordering must be: background, obstacles (including break visuals), boss, dash trail, special success feedback, ship, difficulty tint. This keeps fragments behind the ship and tint above the playfield without hiding the HUD.
- Extend the context mock if needed. Assert: a normal special wall has no opening/fragments; an active `breakEffect` creates segment geometry and fragment strokes; special dashes produce more rings/sparks than normal dashes; normal dashes still do not receive special feedback.

## Acceptance Criteria

- [ ] Each WARNING/BOSS entry creates one centred label for one second; the label is never duplicated at the top, and BOSS reads `BOSS`.
- [ ] A WARNING has a persistent subtle red tint; a BOSS has a persistent black/dark tint instead.
- [ ] A successful special dash visibly creates a local hole at the player crossing height, fading purple fragments, two teal shockwaves, and teal sparks without flash or shake.
- [ ] Ordinary special walls and ordinary dashes retain their existing visual behaviour.

## Validation

- `npm run test -- --run tests/game/renderer.test.js tests/ui/screens.test.js` - renderer and HUD feedback tests pass.
- `npm run test -- --run` - complete suite passes.
- `npm run build` - production build completes.

## Commit Message

```text
feat(game): enhance warning and special break feedback

Plan: 2026-09-22-warning-difficulty-feedback
Phase: P01-warning-difficulty-feedback
Task: T02-warning-and-break-visuals

- show one transient centered warning label with persistent mode tint
- render special wall punch-through fragments and stronger dash success feedback
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending

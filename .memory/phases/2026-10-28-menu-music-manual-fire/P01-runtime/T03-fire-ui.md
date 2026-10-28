# Task: T03 Manual-fire controls and readable firing feedback

## Status: done

## Goal
Bottom charge meter and distinct mobile FIRE button expose the weapon; render alignment, charge and guaranteed hit beam.

## Decision Summary
- D06/D07. ShiftLeft/Right or ControlLeft/Right one action per physical press, no repeats/queued actions; mobile separate button.
- Source: .memory/decisions/2026-10-28-menu-music-manual-fire.md; no auth/database/deployment change.

## Implementation

### I01. Runtime contract
- Related Files: `src/ui/app-controller.js` HUD handlers and keydown/keyup/blur/audio events; `src/ui/game-hud.js` createGameHud/update; existing CSS via rg; `src/game/renderer.js` player/charge/counterattack drawing; UI/controller/renderer tests.

#### Details
- **Signatures, Data & Schema Fields, Execution Flow**: HUD weapon section appears only during boss fight, progressbar0..10 plus ready glow/label; mobile-fire-button invokes handlers.fire, disabled until ready and during WASD/firing/death. CSS hide fire button on fine-pointer desktop like existing mobileSpace; keep gauge visible on desktop, safe-area layout avoiding other controls. Controller fire delegates engine.fire and syncs snapshot; both modifier keys share held-set so holding/repeating or pressing second modifier cannot double fire. Blocked input must not queue after ready; reset lifecycle consistent with Space; preserve browser modifier shortcuts outside gameplay. Mobile pointer/click must not bubble to lift/dash. Render ship toward actual boss core only during firing, preserve collision body. Charge bright small core for.2s, show luminous beam from ship to current boss core after.2s for recovery.1s, then restore normal flight. Emit accepted shot sound once via existing audio event convention; impact bossHit only on HP decrement. Opening tutorial describe manualfire and independent gauge without restoring previously removed WASD paragraphs.
- **Validation and errors**: reject unavailable actions without consuming ready ammo or replaying later; validate finite deltas; guard null boss and restart lifecycle. Keep deterministic tests.
- **State Transition & Return**: public engine snapshot must represent real state with copied nested mutable data; final statuses match the contract above.

### I02. Behavior verification
- Related Files: test paths listed in I01; modify or new as specified.
- Keyboard modifier repeat/blocked lifecycle, touch/button isolation, meter ready/disabled states, desktop button hidden, mobile landscape fits, renderer records actual target direction/beam without altering hitbox.

## Acceptance Criteria
- [x] Observable goal and all approved timings/counts above implemented.
- [x] Specified validation passes without replacing meaningful adjacent guarantees.

## Validation
- `npm test -- --run tests/ui/game-hud.test.js tests/ui/app-controller.test.js tests/game/renderer.test.js tests/integration/mobile-input.test.js` ? expected successful exit; run individual commands sequentially when separated above.
- `git diff --check` ? no whitespace errors.

## Commit Message
```text
feat(game): fire ui

Plan: 2026-10-28-menu-music-manual-fire
Phase: P01-runtime
Task: T03-fire-ui

- Manual-fire controls and readable firing feedback
- Validate approved behavior and preserve adjacent mechanics
```

## Progress
- [x] ?? ??
- [x] ?? ??
- commit: pending

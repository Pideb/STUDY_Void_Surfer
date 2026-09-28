# Task: T03 Menu HUD and Stage Transition

## Status: pending

## Goal

Make the main menu visibly match the approved HUD COMMAND composition, hide stage/aircraft names during play, and replace the palette crossfade with an image-backed right-to-left push transition lasting 1.5 seconds.

## Decision Summary

- Main menu has no card: left artwork/aircraft, direct right-side HUD-style actions, logout separated below; mobile reflows without restoring card framing.
- In-play stage and aircraft names are removed from visible DOM HUD. Score and combat/status UI remain.
- Stage change is visual only: incoming background moves from right to left and pushes the outgoing background out; collision/scoring/timing are not modified.

## Implementation

### I01. Main menu and gameplay HUD

- Related Files:
  - `src/ui/screens.js` :: `renderMenuScreen` — modify to use left brand/player content and right direct menu actions.
  - `src/ui/game-hud.js` :: `createGameHud`, `update` — remove visible `.hud-identity`, stage name, and aircraft name only.
  - `src/styles.css` :: `.menu-overlay`, `.menu-brand`, `.menu-actions`, `.account-actions`, `.hud-identity`, responsive rules — modify.
  - `tests/ui/screens.test.js`, `tests/ui/game-hud.test.js`, `tests/ui/accessibility.test.js` — modify.

#### Details

- Keep current menu actions (`게임 시작`, `기체 선택`, icon-only sound toggle, `로그아웃`), bold pilot identity/greeting, keyboard focus, accessible labels, logout separation, and no card-panel wrapper. Place branding/identity over the left illustrated scene; place menu actions on the right at desktop width.
- Reflow to a readable single-column touch layout at the existing `max-width: 700px` breakpoint; maintain touch target sizes and reduced-motion behavior.
- Remove construction and updates for visible stage/aircraft identity labels in `createGameHud`. Keep score, pause/mute controls, WARNING/BOSS banner, BOSS HP, attack messages/telegraphs, challenge sequence/timer/status, and mobile Space control.
- Add tests asserting gameplay HUD never contains the stage or aircraft name even when snapshot has both, while the retained score and boss/attack labels still render. Keep screen-reader-only challenge/accessibility announcements intact.

### I02. Implement the 1.5-second scene push

- Related Files:
  - `src/game/constants.js` :: `STAGE_TRANSITION_SECONDS` — change value from `0.8` to `1.5`.
  - `src/game/renderer.js` :: `drawStageBackground`, `drawBackgroundTransition`, `render` — draw translated outgoing/incoming full-screen art.
  - `tests/game/game-engine.test.js` :: stage transition duration/progress assertions; modify.
  - `tests/game/renderer.test.js` :: incoming/outgoing X-offset and completion assertions; modify.

#### Details

- Preserve stage rotation schedule and shuffle bag. Keep engine snapshot transition fields `fromKey`, `toKey`, `progress`, `durationSeconds`; only duration changes.
- Let `p = clamp(progress, 0, 1)` and smooth it using `ease = p*p*(3-2*p)`. Render outgoing background with x offset `-ease*WORLD_WIDTH`, then incoming background at `(1-ease)*WORLD_WIDTH`; both use the existing `WORLD_WIDTH`/`WORLD_HEIGHT` logical viewport and are clipped to its bounds.
- When no transition exists, draw the current full-screen background at `(0,0)`. During a transition, preserve normal/BOSS treatment per each background key; do not use global alpha as the transition mechanism.
- Background translation must not translate UI, player, hazards, telegraphs, or collision geometry. Continue rendering game entities in their normal viewport coordinates.
- Under `prefers-reduced-motion`, expose a renderer/UI motion preference that draws the incoming scene with a short crossfade (≤0.15 sec) rather than a spatial push; no gameplay state changes.

## Acceptance Criteria

- [ ] Main menu has the approved left-scene/right-HUD layout without card framing, with logout separated below.
- [ ] Gameplay display contains no stage/region or aircraft identity text; essential game/combat information remains.
- [ ] At progress 0, outgoing scene is at x=0 and incoming at x=960; at 0.5 both are moving in the correct direction; at 1 incoming scene is at x=0.
- [ ] Engine transition duration is exactly 1.5 seconds and no collision/scoring snapshots change because of rendering.
- [ ] Reduced-motion preference avoids the spatial slide and remains readable.

## Validation

- `npm run test -- --run tests/game/game-engine.test.js tests/game/renderer.test.js tests/ui/screens.test.js tests/ui/game-hud.test.js tests/ui/accessibility.test.js` — all targeted behavior and DOM assertions pass.
- `npm run build` — desktop/mobile CSS and renderer bundle successfully.
- `npm run dev` — manually inspect main menu, regular play, WARNING/BOSS, and a stage transition at desktop and mobile viewport sizes.

## Commit Message

```text
feat(ui): apply game menu and stage scene transitions

Plan: 2026-09-28-game-visual-asset-integration
Phase: P01-visual-prototype
Task: T03-menu-hud-transition

- apply HUD COMMAND menu and remove in-play identity labels
- push the next stage in from the right over 1.5 seconds
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

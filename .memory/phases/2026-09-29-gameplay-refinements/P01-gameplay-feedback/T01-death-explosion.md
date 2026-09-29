# Task: T01 Death Explosion Before Game Over

## Status: done

## Goal
After any lethal event, freeze the run, play a roughly 0.5-second ship destruction effect, then enter the existing game-over flow once.

## Decision Summary
- A fatal run first enters a frozen death-effect interval; only the visual effect timer advances.
- Preserve the reason, final score, aircraft identity, and single leaderboard submission when game-over begins.

## Implementation

### I01. Add a frozen death-effect state and delayed terminal transition
- Related Files:
  - `src/game/constants.js` :: add `PLAYER_DEATH_EFFECT_SECONDS = 0.5`.
  - `src/game/game-engine.js` :: `stop`, `update`, `lift`, `dash`, `pause`, `start`, `getSnapshot`; add death-effect state and delay terminal state.
  - `tests/game/game-engine.test.js` :: verify death-effect lifecycle for collision/boundary and input freeze.

#### Details
- State shape:
  ```ts
  type DeathEffect = {
    reason: string; elapsedSeconds: number; durationSeconds: 0.5;
    x: number; y: number; aircraftId: string;
  } | null;
  ```
- `stop(reason)` is idempotent. When playing and no effect exists, preserve `gameOverReason`, capture player position/aircraft ID in `deathEffect`, and retain `GAME_STATES.PLAYING` for the effect interval.
- At the start of `update(nowMs)`, when a death effect exists, advance only its timer with the existing capped frame delta. Do not update physics, gameplay elapsed time, score, obstacles, stage, attacks, collisions, or spawning. At duration, set `GAME_STATES.GAME_OVER` and return.
- While the effect is active, `lift`, `dash`, and `pause` must be rejected/no-op. Keep reason and score stable. `start()` resets the effect; `getSnapshot()` returns a defensive copy.
- All existing fatal reasons (`boundary`, `obstacle`, `projectile`, `laser`, etc.) use the same effect. Repeated `stop()` calls cannot restart its timer.

### I02. Render ship breakup and hand off to the existing UI
- Related Files:
  - `src/game/renderer.js` :: `createRenderer().render`, new `drawShipDeathEffect`; suppress live ship/trail during death and draw deterministic fragments around the captured position.
  - `src/ui/app-controller.js` :: `renderFrame`, `finishGame`; keep scheduling frames during the effect and call existing game-over/leaderboard flow only after terminal state.
  - `tests/game/renderer.test.js` :: test flash/fragments at multiple progress values and suppression of the live ship.
  - `tests/ui/app-controller.test.js` :: assert game-over/score submission starts after the effect, once.

#### Details
- Draw a bright central flash plus 8–12 angular fragments expanding/fading from `deathEffect.x/y`, using the selected aircraft's existing bright visual color. Derive stable angles from fixed indices; do not consume random values per render.
- Progress is `clamp(elapsedSeconds / durationSeconds, 0, 1)`. Expand fragment radius and fade alpha to zero by completion. Respect reduced-motion by using a minimal static flash while preserving the same delay.
- Keep the final stage/background/collision scene visible. Hide live ship and exhaust/trail while `deathEffect` is active.
- `renderFrame` continues while engine remains playing. On terminal state call `finishGame()` once; existing score submission and restart/menu actions remain unchanged.
- Renderer must not mutate snapshots.

## Acceptance Criteria
- [x] Game-over UI appears after, not on the fatal frame; the effect lasts about 0.5 seconds.
- [x] World simulation, score, and inputs remain frozen during the effect.
- [x] All lethal causes retain their reason/final score and use the same effect.
- [x] Game-over screen and score submission occur once; restart remains usable.

## Validation
- `npm test -- --run tests/game/game-engine.test.js tests/game/renderer.test.js tests/ui/app-controller.test.js`
- `git diff --check`

## Commit Message
```text
feat(game): show ship destruction before game over

Plan: 2026-09-29-gameplay-refinements
Phase: P01-gameplay-feedback
Task: T01-death-explosion

- Freeze gameplay while a short ship explosion plays
- Delay the existing game-over flow until the effect completes
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: `feat(game): show ship destruction before game over`

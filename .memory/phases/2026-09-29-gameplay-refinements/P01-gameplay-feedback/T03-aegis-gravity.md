# Task: T03 Ease AEGIS Gravity

## Status: done

## Goal
Make AEGIS less punishing to control by reducing gravity from 2.0x to 1.5x while preserving its precise 0.6x lift response.

## Decision Summary
- Change only AEGIS gravity to `1.5x`; keep lift at `0.6x`.
- Shared hitbox, speed, scoring, and other aircraft remain unchanged.

## Implementation

### I01. Tune AEGIS gravity and verify per-frame movement
- Related Files:
  - `src/game/constants.js` :: `AEGIS_GRAVITY_MULTIPLIER`, set to `1.5`.
  - `src/game/aircraft.js` :: preserve `liftMultiplier: AEGIS_LIFT_MULTIPLIER` in catalog.
  - `tests/game/aircraft.test.js` :: assert gravity 1.5, lift 0.6, unchanged speed/score multipliers.
  - `tests/game/game-engine.test.js` :: update snapshot expectation; test 100ms gravity accumulation and unchanged lift impulse.

#### Details
- Do not alter `GRAVITY`, `LIFT_VELOCITY`, shared player physics, or other aircraft definitions.
- With default gravity 900 and a 100ms update from zero vertical velocity, AEGIS gravity adds `135 px/s` before world-bound handling. Lift remains `-216 px/s` (`-360 × 0.6`). Assert using stable tolerances and existing update semantics.
- Preserve unlock threshold and aircraft name/visual key.

## Acceptance Criteria
- [x] AEGIS gravity is 1.5x and lift remains 0.6x.
- [x] AEGIS falls less sharply; NOVA and VELOCITY physics are unchanged.
- [x] Existing input semantics and shared hitbox remain unchanged.

## Validation
- `npm test -- --run tests/game/aircraft.test.js tests/game/game-engine.test.js tests/game/player.test.js`
- `git diff --check`

## Commit Message
```text
fix(game): ease AEGIS gravity handling

Plan: 2026-09-29-gameplay-refinements
Phase: P01-gameplay-feedback
Task: T03-aegis-gravity

- Reduce AEGIS gravity to 1.5x
- Preserve its precise 0.6x lift response
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: `fix(game): ease AEGIS gravity handling`

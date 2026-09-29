# Task: T01 AEGIS Tuning

## Status: done

## Goal
Set AEGIS gravity to `1.3x` and lift to `0.7x`, and make the aircraft-selection stats accurately display those values.

## Decision Summary
- The confirmed values replace `AEGIS_GRAVITY_MULTIPLIER = 1.5` and `AEGIS_LIFT_MULTIPLIER = 0.6`.
- `src/game/aircraft.js` consumes these constants in the AEGIS catalog definition; preserve that wiring.
- The hangar description must show the exact stat string `중력 ×1.3 · 상승력 70%`.

## Implementation

### I01. Update AEGIS multipliers and focused tests
- Related files:
  - `src/game/constants.js` :: `AEGIS_GRAVITY_MULTIPLIER`, `AEGIS_LIFT_MULTIPLIER` — change values; modify.
  - `src/game/aircraft.js` :: `AIRCRAFT_CATALOG` — read-only unless a regression is found.
  - `src/ui/app-controller.js` :: `getHangarAircraft` — update only AEGIS `stats`; modify.
  - `tests/game/aircraft.test.js` :: AEGIS catalog assertions — add/update exact multiplier assertions; modify.
  - `tests/ui/app-controller.test.js` :: hangar selection behavior — assert AEGIS stats text; modify.

#### Details
- Set `AEGIS_GRAVITY_MULTIPLIER` to numeric `1.3` and `AEGIS_LIFT_MULTIPLIER` to numeric `0.7`.
- In `getHangarAircraft`, replace only AEGIS stats text `중력 ×2 · 상승력 60%` with `중력 ×1.3 · 상승력 70%`; keep its descriptive prose and all other aircraft copy unchanged.
- Keep AEGIS unlock score, score multiplier, speed, spawn interval, visual key, and all DEFAULT/VELOCITY values unchanged.
- Assert the exported AEGIS definition has `gravityMultiplier === 1.3` and `liftMultiplier === 0.7`.
- Assert the AEGIS `.aircraft-option` displays `.aircraft-stats` text exactly `중력 ×1.3 · 상승력 70%`.

## Acceptance Criteria
- [ ] AEGIS catalog exposes gravity `1.3` and lift `0.7`.
- [ ] Aircraft selection displays `중력 ×1.3 · 상승력 70%` for AEGIS.
- [ ] Existing aircraft catalog tests pass without changing other aircraft properties.

## Validation
- `npm test -- --run tests/game/aircraft.test.js tests/ui/app-controller.test.js`

## Commit Message
```text
fix(game): tune AEGIS flight response

Plan: 2026-09-29-gameplay-final-tweaks
Phase: P01-gameplay-and-viewport
Task: T01-aegis-tuning

- Set AEGIS gravity and lift multipliers to confirmed values
- Show the confirmed stats in aircraft selection and cover both with tests
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

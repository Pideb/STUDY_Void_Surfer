# Task: T02 VELOCITY Fast-BOSS Speed Adjustment

## Status: done

## Goal
Limit VELOCITY to 2.2 times base scroll speed during fast BOSS-pattern intervals while keeping its 2x speed in every other interval and preserving other aircraft balance.

## Decision Summary
- VELOCITY plus fast BOSS should yield `baseSpeed × 2.2`, down from `baseSpeed × 1.25 × 2` = 2.5x; apply a `0.88` factor after composing both multipliers.
- Apply to fixed-fast encounters and the fast phase of shift encounters only.

## Implementation

### I01. Apply a VELOCITY-only fast-BOSS compatibility factor
- Related Files:
  - `src/game/constants.js` :: add `VELOCITY_FAST_BOSS_SPEED_MULTIPLIER = 0.88` (2.5x composed speed × 0.88 = 2.2x base).
  - `src/game/game-engine.js` :: `applyAircraftDifficulty`, `getCurrentDifficulty`; apply only when `aircraft.id === 'velocity'`, `difficulty.isBoss`, and `difficulty.speedMultiplier === 1.25`.
  - `tests/game/game-engine.test.js` :: assert speed for fixed fast, fixed slow, shift slow, and shift fast for VELOCITY and a comparison craft.

#### Details
- Keep `getBossSpeedMultiplier()` and the 0.75/1.25 BOSS values unchanged. Apply the extra factor after composing BOSS and aircraft multipliers.
- Fast VELOCITY formula: `baseSpeed * 1.25 * VELOCITY_MOVEMENT_MULTIPLIER * VELOCITY_FAST_BOSS_SPEED_MULTIPLIER`, exactly 2.2x base.
- Slow BOSS, normal, WARNING, and non-VELOCITY formulas remain unchanged. For shift, reevaluate the active 2-second phase every update so the factor applies only in fast phases.
- Preserve VELOCITY score multiplier `1.5`, spawn interval multiplier `0.5`, gaps, projectile speed, and score pacing. Keep the catalog speed multiplier at 2; if needed expose a distinct effective adjustment field.

## Acceptance Criteria
- [x] VELOCITY fixed-fast and shift-fast BOSS speed is 2.2x base within float tolerance.
- [x] VELOCITY slow-BOSS speed remains 1.5x and ordinary speed remains 2x base.
- [x] Other aircraft retain the existing 1.25x fast BOSS multiplier.
- [x] Score/spawn bonuses remain unchanged.

## Validation
- `npm test -- --run tests/game/difficulty.test.js tests/game/game-engine.test.js`
- `git diff --check`

## Commit Message
```text
fix(game): soften VELOCITY speed during fast BOSS patterns

Plan: 2026-09-29-gameplay-refinements
Phase: P01-gameplay-feedback
Task: T02-velocity-boss-speed

- Cap VELOCITY fast-BOSS speed at 2.2x base
- Preserve other aircraft and BOSS speed profiles
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: `fix(game): soften VELOCITY speed during fast BOSS patterns`

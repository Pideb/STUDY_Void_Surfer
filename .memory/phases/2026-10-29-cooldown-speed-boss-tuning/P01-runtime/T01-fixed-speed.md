# Task: T01 Fixed Speed

## Status: pending

## Goal
All aircraft gain exactly10 actual px/s per10 monotonic progression points, with100-point growth cap: NOVA/AEGIS240->340, VELOCITY480->580.

## Decision Summary
- Replace compounding with fixed additions. Preserve two-second easing, boss entry snapshot/factors, pause monotonicity, reward progression and VELOCITY spawn/final-score traits.
- Current architecture multiplies pre-aircraft base downstream; divide the added increment by aircraft.scrollSpeedMultiplier to avoid doubling VELOCITY growth.

## Implementation
### I01. Shared speed formula and cap
- Related Files:
  - `src/game/constants.js` :: speed constants — modify.
  - `src/game/difficulty.js` :: `getBaseSpeed`, `getDifficulty` — modify.
  - `src/game/aircraft.js` :: definitions / speedCapScore — read-only unless a cleanup is required by constant use.
  - `src/game/game-engine.js` :: `applyAircraftDifficulty`, boss base snapshot and special spawning — audit; modify only if formula consumers need correction.
  - `src/game/barrier-spacing.js` :: `getBarrierSpeedBound` — audit.
#### Details
- Signatures: `getBaseSpeed(progressionScore:number, aircraftId:string='default'):number`; keep callers' pre-multiplier contract.
- Replace `SPEED_STEP_MULTIPLIER=1.1` with `SPEED_STEP_INCREMENT=10`; keep `BASE_SCROLL_SPEED=240`, `SPEED_STEP_SCORE_POINTS=10`, `SPEED_CAP_SCORE=100`; set `VELOCITY_SPEED_CAP_SCORE=100`.
- Obtain normalized aircraft via `getAircraftDefinition`. Cap normalized integer nonnegative progression score. Return `240 + floor(capped/10)*10 / aircraft.scrollSpeedMultiplier`.
- Model fields remain numeric/non-null: baseSpeed (pre-aircraft), actual scrollSpeed/targetScrollSpeed (post-aircraft), progressionScore (monotonic), aircraft.speedCapScore100. No persistent schema change.
- Keep existing finite/negative score fallback and default aircraft fallback. No new exception or I/O.
- Downstream multiplication yields actual240+10*n or480+10*n; do not apply another movement factor to increments.
- Preserve boss snapshot, slow.75/fast1.25/VELOCITY-fast.88, return-to-normal transition; future special-wall speed bounds must use same aircraft-aware formula.

### I02. Behavioral validation
- Related Files: `tests/game/difficulty.test.js`, `tests/game/game-engine.test.js`, `tests/game/barrier-spacing.test.js` — modify; relevant existing integration tests read-only initially.
- Assert literal actual targets for every aircraft at0/9/10/20/99/100/109/10000, invalid score fallback and +10 actual increments.
- Existing tests with264/290.4 must become250/260. Confirm boss-clear+10/pause progression and smoothly completed transitions, held boss base and capped restore.
- Check future bound at cap against explicit425 for NOVA/AEGIS and725 conservative VELOCITY (boss-fast adjustment may make actual lower); ensure early bounds are not prematurely capped.

## Acceptance Criteria
- [ ] Actual capped normal speeds340/340/580 and equal+10 steps proven.
- [ ] Boss factors, pause behavior, scoring and future wall-spacing invariants preserved.

## Validation
- `npm test -- --run tests/game/difficulty.test.js tests/game/game-engine.test.js tests/game/barrier-spacing.test.js tests/integration/combat-evolution.test.js tests/integration/dash-boss-flow.test.js` — pass.
- `git diff --check` — clean.

## Commit Message
```text
feat(game): use fixed speed increments for every aircraft

Plan: 2026-10-29-cooldown-speed-boss-tuning
Phase: P01-runtime
Task: T01-fixed-speed

- Add ten actual speed units per ten progression points for every craft
- Share the one-hundred-point cap while preserving boss and spacing factors
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

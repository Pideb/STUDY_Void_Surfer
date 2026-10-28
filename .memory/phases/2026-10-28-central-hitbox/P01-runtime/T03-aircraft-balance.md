# Task: T03 Aircraft caps and AEGIS one-shot boss damage

## Status: pending

## Goal
Aircraft caps and AEGIS one-shot boss damage with observable behavior defined below.

## Decision Summary
- D06/D08: progression cap70 velocity/100 others; AEGIS laser3damage, all bosses maxHP3.
- Source: .memory/decisions/2026-10-28-central-hitbox.md. Preserve other existing behavior.

## Implementation

### I01. Production contract
- Related Files (modify/new/read-only as stated): src/game/constants.js; src/game/aircraft.js catalog; src/game/difficulty.js getBaseSpeed/getDifficulty; src/game/barrier-spacing.js; src/game/game-engine.js speed consumers/updateBossAttack; src/game/boss.js laser-hit; src/ui/screens.js hangar/tutorial; README; difficulty/aircraft/barrier/boss/UI tests; manual-fire and mixed-cycle integration tests.

#### Details
- **Signatures, schema fields and flow**: Add definition speedCapScore:number=100(default/aegis),70(velocity) and bossLaserDamage:number=1/3/1. getBaseSpeed(progressionScore,aircraftId=default) clamps using catalog; extend getDifficulty trailing aircraftId default so existing calls keep API, pass actual id from all engine calls including boss preview, entry base and future-gap bounds. getBarrierSpeedBound adds aircraftId default and same cap, preserving movement multiplier and conservative bossfactor1.25. All score progression remains monotonic, final multiplier1.5 unaffected. Keep boss slow.75 fast1.25 and velocityfast.88,2s transitions. advanceBossEncounter laser-hit takes value damage(default1), normalizes positive finite and clamps hp0..maxHp while incrementing laserHits byONE; add damageTaken:number0 to avoid hp=maxHp-laserHits. Engine passes aircraft.bossLaserDamage only at actual impact; no damage on challenge. Boss maxHP/HUD3 cells for all; AEGIS firstlaser3->0, one hit effect/reward/portal. Add snapshot aircraft properties for consistent UI/tutorial. Hangar describes capability and newcaps; tutorial exception AEGIS1shot without restoring unwanted WASD paragraph. Tests cap boundaries69/70/79 and99/100/109,150/10000, all aircraft/boss exit and pause, future spacing; one-shot AEGIS vs three others and exact-once hit/reward.
- **Validation & errors**: reject invalid/non-finite coordinates/times without granting success; unavailable actions do not consume resources. Handle missing scene/context layouts safely. No backend/schema dependency.
- **State/return**: public snapshots remain detached; operations reflect real state without mutation hooks; visual and actual geometry agree.

### I02. Verification
- Related Files: associated existing tests listed above; new test paths are explicit.
- Exercise exact boundaries and changed behavior plus existing adjacent regressions. Do not silently delete meaningful checks.

## Acceptance Criteria
- [ ] Production behavior matches all stated values/edge cases.
- [ ] Specified validation passes.

## Validation
- `npm test -- --run tests/game/difficulty.test.js tests/game/aircraft.test.js tests/game/barrier-spacing.test.js tests/game/boss.test.js tests/game/game-engine.test.js tests/ui/screens.test.js tests/integration/manual-boss-fire.test.js tests/integration/dash-boss-flow.test.js tests/integration/combat-evolution.test.js` - each command must succeed; semicolon-separated commands run sequentially.
- `git diff --check`

## Commit Message
```text
feat(game): aircraft balance

Plan: 2026-10-28-central-hitbox
Phase: P01-runtime
Task: T03-aircraft-balance

- Aircraft caps and AEGIS one-shot boss damage
- Validate approved mechanics and preserve adjacent guarantees
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

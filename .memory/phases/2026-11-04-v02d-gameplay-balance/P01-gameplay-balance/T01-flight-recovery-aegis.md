# Task: T01 Flight recovery and AEGIS recharge

## Status: done

## Goal
Flight recovery and AEGIS recharge, according to confirmed decisions for 2026-11-04-v02d-gameplay-balance. Finish independently verifiable behavior before advancing.

## Decision Summary
- Scope, numbers and constraints are fixed below. Preserve existing unrelated behavior.
- No deployment; changes require sequential scoped commits and memory pointer updates.

## Implementation

### I01. Production integration
- Related Files:
- src/game/constants.js :: CHALLENGE_RECOVERY_SECONDS (modify,0.3).
- src/game/game-engine.js :: resolveChallenge/update/lift/startWarning; introduce beginPlayerRecovery helper.
- src/game/aircraft.js :: AIRCRAFT_CATALOG derived fields bossLaserRechargeSeconds.
- src/game/boss-weapon.js :: createBossWeapon(aircraftId='default').
- src/game/boss.js :: createBossEncounter(number,stageId='crystal-gates',aircraftId='default').
- src/ui/screens.js :: aircraft/preflight copy.
- src/ui/app-controller.js :: actual aircraft selection description, include30s recharge.
- tests/game/boss-weapon.test.js, tests/integration/manual-boss-fire.test.js, tests/game/wasd-challenge.test.js; add tests/game/flight-recovery.test.js.
- scripts/game-catalog.mjs and documentation templates are handled in T04.

#### Details
Types: AircraftDefinition.bossLaserRechargeSeconds:number=30 for aegis,10 otherwise; BossWeapon {chargeSeconds:number=0,rechargeSeconds:number,ready:boolean=false,firing:object|null}. Existing firing chargeSeconds=.5,durationSeconds=.7,damage3 for AEGIS remain.
Use aircraft definition in createBossWeapon; thread chosen aircraft at actual encounter creation, not live menu state. Default preserves existing callers. On every reset/new boss new weapon starts empty.
beginPlayerRecovery(): void sets velocityY=Math.min(0,velocityY) and remainingSeconds=durationSeconds=.3. Call after both challenge outcomes and exactly at weapon lock expiry BEFORE integrating any remaining flight portion in that frame; if expiry is exactly at frame end initialize for next frame. No repeated triggers for already-cleared firing; keep upward momentum. Existing linear gravity integration and immediate normal lift/cancel remain. Pauses do not consume recovery. No invincibility.
UI copy describes AEGIS30s vs others10s; do not change player-authored historical update bullets.
Test both challenge outcomes, weapon expiry with fractional dt, zero downward carry, upward preservation, immediate lift, pause, restart and AEGIS first/subsequent30s/one stored shot. Use engine fixture with gravity0 for long encounter preparation, actual gravity for recovery or pure helper where needed. Verify selected aircraft and one-hit damage stay intact.

### I02. Verification
Add/update meaningful behavior tests for the specified edge cases. No test-only changes to production cadence. Fix regressions caused by these exact behavior changes; report other findings separately.

## Acceptance Criteria
- [x] All specified user-visible behaviors implemented.
- [x] Targeted commands pass; no protected deployment history altered.
- [x] Task status/progress and current pointer synchronized after commit.

## Validation
- `npm test -- --run tests/game/boss-weapon.test.js tests/game/flight-recovery.test.js tests/game/wasd-challenge.test.js tests/integration/manual-boss-fire.test.js tests/game/aircraft.test.js tests/ui/screens.test.js`

## Commit Message
```text
fix(game): smooth control recovery and give AEGIS a thirty-second charge

Plan: 2026-11-04-v02d-gameplay-balance
Phase: P01-gameplay-balance
Task: T01-flight-recovery-aegis

- Implement confirmed behavior and validate regression boundaries
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- Validation: 111 tests across7 files passed. Commit: task commit containing this blueprint.
- commit: a5f60d1

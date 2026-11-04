# Task: T03 Short line shots between walls without spawn gaps

## Status: done

## Goal
Short line shots between walls without spawn gaps, according to confirmed decisions for 2026-11-04-v02d-gameplay-balance. Finish independently verifiable behavior before advancing.

## Decision Summary
- Scope, numbers and constraints are fixed below. Preserve existing unrelated behavior.
- No deployment; changes require sequential scoped commits and memory pointer updates.

## Implementation

### I01. Production integration
- Related Files:
- src/game/constants.js :: new line-only active/sweep/fade/spacing constants.
- src/game/boss-attacks.js :: createSingleLaser, laserClock, updateLaser, getLaserFrontX; add pure horizontal firing-window helper.
- src/game/game-engine.js :: prepareLineLaser/scheduleBossAttack/scheduleAmbientLaser/updateAmbientLaser/updateBossAttack/update spawn gate.
- src/game/collision.js :: intersectsPlayerLaser waiting guard.
- src/game/laser-renderer.js :: both full/detail warning paths, per-laser fade duration.
- tests/game/laser-safety.test.js, tests/integration/ambient-lasers.test.js, tests/game/collision.test.js; add tests/integration/line-laser-cadence.test.js.

#### Details
Line attack model: kind='single'; ys:number[] fixed at creation; waitingForGap:boolean; activeDurationSeconds=.2, sweepDurationSeconds=.1 (implementation default ensuring arrival before expiry),fadeDurationSeconds=.1; telegraph remains.7. Quarter laser retains existing1s active/.4s sweep/.15s fade and adaptive >=2s warning.
createSingleLaser samples random center within [.15*H+thickness/2,.85*H-thickness/2], independent of openings/playerY. For2 lines require clear gap .25*H (135 at540) between18px cores (153 center separation); choose from legal vertical intervals; downgrade to1 if no room. Announced ys never change.
Pure canFireLineLaser input includes player damage bounds/obstacles, upper scroll speed and emission duration+small margin. Reject any wall column currently touching player or arriving before shot ends; preceding wall must be fully clear. Check all wall kinds regardless broken special (passage timing); no opening-height prediction. Use start-of-frame positions reconstructed from previousObstacles or known frame displacement for precise crossing. Conservative acceleration upper bound via getBarrierSpeedBound plus target speed. No future wall can travel from spawn to player during.2s at supported speed, cover that invariant with test.
updateLaser(laser,dt,{canActivate(offsetSeconds):boolean}={}): preserve old default auto-activation for unit callers/quarter; count full telegraph then gate single emission. While blocked hold waitingForGap=true (zero telegraph is okay, renderer must keep warning and collision must not damage). When permitted clear flag and advance leftover frame time. Recheck at actual start using horizontal timing; do not shorten warning. Check pause/no motion and both lines same slot.
Engine remove line-induced wallSpawningPaused=true and accumulator resets; ambientAttack no longer disables spawning. Global/pending/entrance/transition resets stay. Attack resolution no timer reset for line lasers. Keep normal cadence while warning/firing/fading, and skip/wait narrow slots with no catch-up burst.
Meaningful integration: compare identical normal wall spawn times with/without ambient chance, verify actual starts are clear and whole damaging duration cannot overlap wall contact at max NOVA/VELOCITY/fast boss speeds; paused delayed warnings harmless; successful two-line spacing; warnings may overlap wall passage, fixed height even when delayed; boss inline doesn't pause spawns; quarter unchanged. Update old opening-safe tests to new behavior, retaining exported historical safety utility tests if utilities remain.

### I02. Verification
Add/update meaningful behavior tests for the specified edge cases. No test-only changes to production cadence. Fix regressions caused by these exact behavior changes; report other findings separately.

## Acceptance Criteria
- [x] All specified user-visible behaviors implemented.
- [x] Targeted commands pass; no protected deployment history altered.
- [x] Task status/progress and current pointer synchronized after commit.

## Validation
- `npm test -- --run tests/game/laser-safety.test.js tests/game/collision.test.js tests/game/renderer.test.js tests/integration/ambient-lasers.test.js tests/integration/line-laser-cadence.test.js tests/game/boss-patterns.test.js`

## Commit Message
```text
fix(game): fit brief line lasers between walls without delaying spawns

Plan: 2026-11-04-v02d-gameplay-balance
Phase: P01-gameplay-balance
Task: T03-line-laser-cadence

- Implement confirmed behavior and validate regression boundaries
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- Validation: main targeted86 tests and adjacent regressions passed; old opening-safe assertions updated to confirmed timing-based behavior. Commit: containing task commit.
- commit: 0538251

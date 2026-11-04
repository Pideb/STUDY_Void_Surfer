# Task: T01 portal and firing behavior

## Status: pending

## Goal
After a boss clear, generate no additional walls before the portal; AEGIS holds its firing pose for1.2s and cannot damage the boss before1s.

## Decision Summary
- Existing walls drain instead of disappearing. Portal visuals and new-stage15-wall cadence remain unchanged.
- Only AEGIS action timing changes; recharge and one-hit damage remain30s and3HP. No invincibility.

## Implementation

### I01. State transition
- Related Files: `src/game/game-engine.js` :: spawnObstacle/updateSpawning/advanceStage/updateStage/update; modify.
- Signatures remain unchanged. pendingStageAdvance removes `extraSpawned:number`; retains order:string[],index:number,fromStageId:string,destinationStageId:string,fromKey:string,toKey:string.
- Remove extraSpawned increment and two-wall spawn authorization. canSpawnNormalWall(bossCadence) only permits normal phase. Include pendingStageAdvance in the explicit spawn-clock suspension gate.
- updateStage begins createPortalTransition as soon as pending exists, obstacles.length===0, no ambient attack and no existing transition. Remove extraSpawned>=2 condition to avoid deadlock. Preserve normal drain/collision of visible walls. Reset15-wall cadence only at portal completion, keep first spawn logic there.
- Removed extra walls no longer yield two extra score points. Boss clear remains+10.

### I02. Aircraft-specific shot action
- Related Files: `src/game/aircraft.js` :: derived definitions; `src/game/boss-weapon.js` :: createBossWeapon/startBossWeapon; modify.
- Add AircraftDefinition.bossLaserWindupSeconds:number = aegis?1:.5 and bossLaserActiveSeconds:number=.2.
- createBossWeapon(id='default'): weapon adds windupSeconds:number and activeSeconds:number based on definition, alongside existing rechargeSeconds. startBossWeapon uses those values for firing.chargeSeconds and firing.durationSeconds=sum. Shots must not override timing, readiness/finite-coordinate validation unchanged.
- Existing advanceBossWeapon uses firing timing; no change to contact model unless verification reveals a boundary precision bug. Renderer already divides shot.elapsedSeconds by shot.chargeSeconds; verify its late preparation frame in tests. Engine lock/recovery uses firing.durationSeconds and must remain craft-agnostic.
- Tests: `tests/game/boss-weapon.test.js`, `tests/integration/manual-boss-fire.test.js`, `tests/integration/boss-only-loop.test.js`, affected `combat-evolution`/`dash-boss-flow` aim helpers; add `tests/integration/post-boss-transition.test.js`. Update scripted AEGIS aiming to look1s ahead rather than.5s. Update+12 score assertions to+10. Do not weaken meaningful old assertions; preserve different aircraft hit counts and death/collision behavior.
- Verify0.999s no hit,1s beam begins,1.2s ends; one contact maximum and no damage after expiry. Real engine holds player until1.2s, accepts lift after unlock and starts0.3s recovery. Pauses/restarts preserve/reset appropriate fields. Verify existing walls are not abruptly removed, no fresh wall IDs between clear and portal, score stays fixed through portal and next boss count remains15.

## Acceptance Criteria
- [ ] No post-clear new walls and no portal deadlock.
- [ ] AEGIS1+.2s; NOVA/VELOCITY.5+.2s; single-hit damage and recharge retained.
- [ ] Targeted behavior tests pass.

## Validation
- `npm test -- --run tests/game/boss-weapon.test.js tests/game/flight-recovery.test.js tests/game/boss-cadence.test.js tests/game/portal-transition.test.js tests/integration/manual-boss-fire.test.js tests/integration/boss-only-loop.test.js tests/integration/post-boss-transition.test.js tests/integration/combat-evolution.test.js tests/integration/dash-boss-flow.test.js`

## Commit Message
```text
fix(game): remove post-boss walls and extend AEGIS firing

Plan: 2026-11-04-v02d-transition-aegis-fire
Phase: P01-follow-up
Task: T01-transition-firing
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

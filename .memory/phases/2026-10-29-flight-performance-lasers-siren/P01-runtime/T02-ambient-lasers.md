# Task: T02 Ambient Line Lasers

## Status: done

## Goal
After boss2 is cleared, normal and WARNING flight can emit safe one/two-line lasers without needing a boss object; hazards finish before boss entrance and never invalidate wall openings.

## Decision Summary
- D02: attempt every3 eligible flight seconds,70% probability; one line70%/two lines30%. Keep.7s warning,1s active including.4s sweep,.15s fade and top/bottom15% exclusion.
- Preserve existing shared laser geometry/collision; no extra permanent combat wording, no backlog or concurrent ambient/boss attacks.

## Implementation

### I01. Independent attack lifecycle
- Related Files:
  - `src/game/constants.js` — new `AMBIENT_LASER_UNLOCK_BOSSES=2`, `AMBIENT_LASER_INTERVAL_SECONDS=3`, `AMBIENT_LASER_CHANCE=.7`; reuse existing double-line chance.3.
  - `src/game/game-engine.js` :: `start`, `update`, `updateSpawning`, `updateBossPreview`, `startWarningIfNeeded`, `stop`, `getSnapshot` — modify.
  - `src/game/boss-attacks.js` :: `createSingleLaser`, `updateLaser`, `findSafeLaserY`; `src/game/collision.js` :: `intersectsPlayerLaser` — reuse/read-only.

#### Details
- Add engine session fields `clearedBossCount:number=0`, `ambientLaserElapsedSeconds:number=0`, `ambientAttack:LaserAttack|null=null`. Initialize cleared count from floor(initialCompletedWarningCount/2), increment only on an actual boss clear. Snapshot exposes `clearedBossCount` and deep-cloned `ambientAttack` including copiedys; no syntheticboss object.
- LaserAttack: existing clock fields `telegraphDurationSeconds`, `telegraphRemainingSeconds`, `activeRemainingSeconds`, `activeElapsedSeconds`, `elapsedSeconds`, `fadeRemainingSeconds`; `type:'laser'`, `kind:'single'`, `id:string` from existing monotonic attack ID, `y:number`, `ys:number[]`, `thickness:number`, `safeZone:null`, `styleKey:string` from current stage.
- Eligible clock only while playing/alive, clearedBossCount>=2, no activeambient/boss/entry/preview/portal/pendingstage/challenge. WARNING is eligible when non-boss. Each3s consume one attempt, resettimer; probabilityfail/unsafe geometry consumes opportunity with no catch-up queue.
- Before constructing laser, apply existing imminent unbroken special/hybrid barrier response guard for full laser lifetime plus timingwindow+.2s, using a conservative speed bound for the attack horizon. Reuse existing normal-wall safety policy rather than diverging copies; include hybrid normal gap where relevant, protect moving-gap full excursion. Require actual safe geometry; if none returnnull, do not force a height.
- `createSingleLaser` already degrades2lines to1 if no second height. Use unchanged logic and same .3 double-line roll only on a permitted attempt.
- During ambient warning/active/fade pause FUTURE wall spawns, reset spawnAccumulator, keep existing walls moving and counted. On expiration resume cleanly with at mostone initial resumed spawn; no backlog, do not skip WARNING quotas. Mode switch NORMAL↔WARNING does not cut an existing attack off or change its stage/style.
- Advance active ambient clock independently of boss state, test collision before manual damage/pass processing with the existing laser collision function. Admin invincibility suppresses laser death; Space projectile immunity does not. Fatal hit stops normal processing; no extra point or boss reward.
- Boss threshold may create entry.draining while ambient exists. Stop new ambient attempts, but update existing ambient until all clock fields expire; `updateBossPreview` must wait for BOTH obstacles.length0 and ambientAttacknull before darkening. No silent cancellation/teleportation. Portals may not start with active ambient. Pause/WASDfreeze; death/restart cancel/reset.

### I02. Renderer/audio integration and lifecycle tests
- Related Files:
  - `src/game/renderer.js` :: `render` enemy attack and failure-overlay redraw — modify to draw boss.attack or ambientAttack consistently.
  - `src/ui/app-controller.js` :: `syncCombatAudio` — select active attack as boss.attack ?? ambientAttack. Keep IDs/run dedupe and charge/fire transitions working without boss.
  - New `tests/integration/ambient-lasers.test.js`; `tests/game/laser-safety.test.js`, `tests/game/renderer.test.js`, `tests/ui/app-controller.test.js` — new/modify.

#### Details
- Do not add HUD enemy-laser text removed by the previous plan. Render warning geometry/sweep for ambient and boss alike, including redraw above ink/glitch.
- Test before/after secondclear, both normal/WARNING, deterministic3s attempts/probability boundaries/1vs2 fallback, no-safe/edge/moving-gap protection, special conflict, quota/spawn resume, active collision/Space notimmune/adminimmune, pause/reset and mutated snapshot isolation.
- Force threshold duringambient then assert no darkening/bossmusic/spawn until both walls and fadinglaser end. Exercise source charging/firing audio exactlyonce per attack and no nestedboss dependency.

## Acceptance Criteria
- [x] Ambient attacks appear only after boss2 clear in normal/WARNING and use approved probabilities/safety.
- [x] All clocks, collision, sound, entry drain and wall quotas remain live without overlap/deadlock.

## Validation
- `npm test -- --run tests/integration/ambient-lasers.test.js tests/game/laser-safety.test.js tests/game/renderer.test.js tests/ui/app-controller.test.js tests/integration/boss-entry.test.js tests/game/game-engine.test.js`
- `git diff --check`

## Commit Message
```text
feat(combat): add safe ambient line lasers after the second boss

Plan: 2026-10-29-flight-performance-lasers-siren
Phase: P01-runtime
Task: T02-ambient-lasers

- Run independent laser clocks and collision in normal and WARNING flight
- Preserve wall safety and drain hazards before boss entry
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: 7ff44ed

# Task: T03 Distributed Boss Attacks and Live Roar

## Status: done

## Goal
Use more frequent one/two-line lasers and1..3 stage volleys during wall waves, including special walls, while flight continues until WASD starts.

## Decision Summary
- D06: eligible2s/90%, line count70/30; safe fallback and no burst. Existing global laser rules unchanged.
- D07/D08:0.8s live roar, freeze only actual challenge; uniform1..3 volleys once per WASD cycle, never suppress for special presence/window/dash recovery. Boss3HP and scoring unchanged.

## Implementation
### I01. Shared laser geometry
- Related Files: `src/game/constants.js`, `boss-attacks.js` :: `createSingleLaser`, `collision.js` :: `intersectsPlayerLaser`, `laser-renderer.js` :: `drawLaser`, `game-engine.js` snapshot deep-copy.
#### Details
- **Signatures & Types**:
```typescript
createSingleLaser({ lineCount=1, ...existingGeometry }): Laser|null;
Laser.ys?: number[]; // independent positions, one shared warning/active/fade clock
Laser.y: number; // first line for backward compatibility
BOSS_SINGLE_LASER_INTERVAL_SECONDS=2;
BOSS_SINGLE_LASER_CHANCE=.9;
BOSS_DOUBLE_LASER_CHANCE=.3;
```
- Draw/inspect every ys entry using the existing luminous beam style; both positions announced together. Collision must check either line and the existing right-to-left front; do not advance clocks once per line. Deep-copy ys in snapshots.
- Select from safe Y intervals that protect complete moving normal openings. Exclude the first beam plus room for a player-sized corridor when choosing second; if second has no safe position keep first, if first impossible returnnull. Empty wall phase is not a reason to create a single-line opportunity.
### I02. Finite volley budget and attack arbitration
- Related Files: `src/game/boss.js` :: `createBossEncounter`; `game-engine.js` :: `beginWarningSession`, `startNextBossWallWaveIfNeeded`, `scheduleBossAttack`, `updateBossAttack`, `afterSignature`; renderer/audio existing attack interface retained.
#### Details
- **Data & Schema Fields**: encounter `volleyBudget:number` (integer1..3 sampled once per cycle), `volleysFired:number=0`, `volleyElapsedSeconds:number=0`. Configure initial eligible interval3s; each attack completion starts a fresh interval, no queued catch-up. `attack` remains one active laser OR volley, serialized to avoid incompatible simultaneous attacks; a volley contains its usual multiple projectiles.
- **Execution Flow / Logic**:
  1. Start/reset budgets with each wall wave, including failed-challenge retries. Entered boss counts no eligible time until entrance completes.
  2. While wall combat is eligible and no active attack, accrue independent laser and volley opportunity clocks. At most one new attack per frame. A ready volley takes priority so frequent lasers cannot starve its finite budget; no special-wall/type/window/readiness checks in this branch. Volleys leave wall spawning active; normal and special walls may be present or created during them. Retain charge/path telegraph.
  3. Laser branch checks every2 eligible seconds, resets opportunity even on failed roll/unsafe geometry. Only defer for actual nearby special response conflict, not the entire wave's special-id set. A laser's complete warning+active+fade plus reaction margin must finish before any upcoming barrier's earliest timing window; do not start while such a barrier is already unresolved beside/behind the player. Pause future spawns through laser lifetime so future normal gaps cannot invalidate its warning. Resume bounded without a burst.
  4. When all walls leave, drain any remaining volley budget (fresh interval, finite). Only once all selected volleys and walls have completed, invoke unchanged60% global1..3 sequence then roar; do not call old afterSignature after every volley. No new attack during entrance/roar/challenge/counterattack/clear/portal.
  5. Existing 3 successful counterattack impacts clear boss. Failure retries a fresh wave/budget; no lost quotas, duplicate global phase or permanently paused spawn flag.
### I03. Live roar then full challenge
- Related Files: `game-engine.js` :: `update`, `lift`, `dash`; `src/ui/app-controller.js` :: `triggerLift`, `triggerDash`; related tests.
#### Details
- Remove roar's early frozen-world return. Advance its independent clock once per live frame alongside physics/background/cooldown and animation; no new unrelated attacks. At0.8s create challenge after finishing the live frame and safety checks. The next frame runs only challenge time; avoid taking time away from first full5/later2.8 countdown. Keep roar audio event/id and approved animation.
- Controller and engine accept lift/dash during roar; both reject active challenge/death. Pause behavior follows existing playing-state policy and clocks freeze while paused.
- Tests: RNG endpoints/uniform budget sampled once,1/2/3 usages, real volley overlap with special/hybrid and normal walls, no special gate, no starvation/stall, laser70/30 positions/warnings/collision/fallback, near versus distant special conflicts, roar moves player/world and permits inputs, challenge full time freezes world. Update superseded one-volley/frozen-roar expectations in earlier integration tests only where changed behavior requires.

## Acceptance Criteria
- [x] More frequent one/two-line lasers remain safe and fully telegraphed.
- [x] Exactly sampled1..3 volleys run per cycle and can overlap special walls without a special filter.
- [x] Flight continues during roar; only actual WASD freezes world and retains full timer.

## Validation
- `npx vitest run tests/game/boss-attacks.test.js tests/game/boss.test.js tests/game/boss-flow.test.js tests/game/game-engine.test.js tests/game/renderer.test.js tests/integration/combat-evolution.test.js tests/integration/mobile-input.test.js tests/ui/app-controller.test.js`
- `git diff --check`

## Commit Message
```text
feat(boss): distribute volleys and increase telegraphed laser pressure

Plan: 2026-10-28-dash-boss-flow-refinements
Phase: P01-runtime
Task: T03-boss-scheduler

- Add safe dual-line lasers and finite per-cycle volley budgets
- Keep flight active through roar and freeze only for WASD
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

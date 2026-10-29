# Task: T04 Random Pattern Queue

## Status: done

## Goal
Use every eligible boss block once per shuffled round, with walls included and global lasers always included boss2+, without deadlocks or invalid overlap.

## Decision Summary
- D12 replaces fixed walls->signature->global->WASD coupling. Roar/WASD remains inseparable. Boss HP and manual firing independent of queue exhaustion.

## Implementation
### I01. Pure queue and runtime transitions
- Related Files: new `src/game/boss-patterns.js`; `src/game/boss.js` encounter queue fields; `src/game/game-engine.js` begin/schedule/attack completion/challenge resolution/next wave; constants global chance1 — modify/new.
- `createBossPatternRound(bossNumber:number,rng:()=>number,previous:string|null):string[]` Fisher-Yates shuffle of `walls,signature,global,challenge` with global onlynumber>=2. Normalize RNG; if first equals previous, swap with a different element. No wall-first special case.
- Encounter fields `patternQueue:string[]`, `patternIndex:number`, `lastPattern:string|null`, `completedPatterns:string[]`,cycleNumber starts1. Start in pending/recovery with wall spawning paused until actual first block starts after entrance. Snapshot arrays cloned.
- Block activation owns counters and spawn flags: walls resets warning quota/counts/single-laser/one-shot clocks; signature waits obstacles.length0 then1..3 volleys each3..6; global waits walls0 then1..3 fresh warnings with changing safe quarters; challenge starts live roar then freezes only actual WASD.
- Completing a block advances queue, not hardcoded next type. Walls complete only quota passed+all walls offscreen+attack resolved; signature after budget and all projectiles resolved; global after last fade; challenge after success/failure effect set, no damage/recharge gift.
- After queue exhaustion incrementcycleNumber/reshuffle all eligible blocks. Prevent transition while a manual firing action, entrance, live attack/roar/challenge/hit-defeat phase requires completion. Do not clear or skip unfinished walls/bullets to satisfy order.
- Keep wall mixed quotas, special spacing, one projectile per wall-flight firing, single/two-line laser independent opportunities and resume spawn clock without backlog. Preserve first boss global exclusion and100% inclusion thereafter.
- Boss death stops scheduling/queue immediately; existing defeated/hit/beam recovery then single+10 reward and portal after walls exit.

### I02. Lifecycle verification
- New `tests/game/boss-patterns.test.js`; modify `tests/integration/projectile-phases.test.js`,`tests/game/game-engine.test.js`,`tests/integration/combat-evolution.test.js`,`tests/integration/dash-boss-flow.test.js`.
- Verify eligible sets/all first positions/no boundary repeats; multiple rounds/seeds/all stages; queue progression without firing; global before/after walls; WASD not necessarily last; drain preconditions; no hazard overlap; clear on any queue position with real aimed shots.
- Old tests assuming first-cycle WASD is last must observe full round or identify actual block completion rather than weakening count/safety assertions.

## Acceptance Criteria
- [x] Shuffled complete rounds/encounters cannot stall; all safety/count rules retained.
- [x] Boss2+ global included each full round, boss1 excluded, no adjacent repeat across rounds.

## Validation
- `npm test -- --run tests/game/boss-patterns.test.js tests/integration/projectile-phases.test.js tests/game/game-engine.test.js tests/integration/combat-evolution.test.js tests/integration/dash-boss-flow.test.js`
- `git diff --check`

## Commit Message
```text
feat(boss): shuffle complete attack blocks without fixed phase coupling

Plan: 2026-10-29-boss-motion-aim-patterns
Phase: P01-runtime
Task: T04-pattern-queue

- Include every eligible pattern once per shuffled round
- Drain incompatible hazards and preserve clear progression
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

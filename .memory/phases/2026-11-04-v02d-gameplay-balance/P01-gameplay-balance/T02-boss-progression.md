# Task: T02 Gradual boss walls and unique pattern frequency

## Status: done

## Goal
Gradual boss walls and unique pattern frequency, according to confirmed decisions for 2026-11-04-v02d-gameplay-balance. Finish independently verifiable behavior before advancing.

## Decision Summary
- Scope, numbers and constraints are fixed below. Preserve existing unrelated behavior.
- No deployment; changes require sequential scoped commits and memory pointer updates.

## Implementation

### I01. Production integration
- Related Files:
- src/game/difficulty.js :: getBossWallRules.
- src/game/boss-patterns.js :: createBossPatternRound.
- tests/game/difficulty.test.js, tests/game/boss-patterns.test.js, tests/game/boss-flow.test.js and affected boss fixtures.

#### Details
getBossWallRules(number:number): {gapHeight:number,spawnIntervalSeconds:number,specialChance:number,minSpecials:number,timingWindowSeconds:number}.
Clamp normalized boss to1..4. Rows:180/2/.2/0;165/1.8/.3/1;150/1.6/.4/2;135/1.4/.5/3. timingWindowSeconds=.3 at every tier. Keep seven-wall quota and VELOCITY0.5 multiplier in engine. Keep normal flight and unlocks unchanged.
createBossPatternRound(bossNumber:number,rng:()=>number=Math.random,previous:string|null=null): string[].
Boss1 keeps walls/signature/challenge once. Boss2+ retains walls/signature/global/unique/challenge and adds a second unique iff bounded random<.5. Shuffle finite deterministic RNG; arrange extra unique into a legal nonadjacent position, respecting previous round's last unique and existing no-identical-first boundary. Use finite algorithm, not rejection loop (constant RNG must terminate). Other blocks remain once; unique internal1–3 sets untouched.
Tests seeded distribution approximate50%, exactly1or2 unique, each other block once, no adjacent unique across rounds, every first block reachable, constant/NaN RNG termination, engine can complete repeated rounds; update fixed queue-length assertions to accept5/6. Numeric wall table and min quotas plus every boss special window checked.

### I02. Verification
Add/update meaningful behavior tests for the specified edge cases. No test-only changes to production cadence. Fix regressions caused by these exact behavior changes; report other findings separately.

## Acceptance Criteria
- [x] All specified user-visible behaviors implemented.
- [x] Targeted commands pass; no protected deployment history altered.
- [x] Task status/progress and current pointer synchronized after commit.

## Validation
- `npm test -- --run tests/game/difficulty.test.js tests/game/boss-patterns.test.js tests/game/boss-flow.test.js tests/game/boss-cadence.test.js`

## Commit Message
```text
feat(game): ramp boss walls gradually and increase unique attacks

Plan: 2026-11-04-v02d-gameplay-balance
Phase: P01-gameplay-balance
Task: T02-boss-progression

- Implement confirmed behavior and validate regression boundaries
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- Validation: 32 targeted tests passed, including10000 seeded rounds. Commit: containing task commit.
- commit: a46c1d5

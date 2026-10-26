# Task: T01 WASD Boss Loop

## Status: done

## Goal
첫 보스부터 WASD 3회 성공으로 종료하며 실패해도 벽/챌린지 루프가 계속되고, 보스전 점수는 클리어 보너스 10점만 지급한다.

## Decision Summary
- 투사체/반사 후 추가 챌린지는 런타임에서 제거. 매 보스 HP 3, 챌린지 성공당 HP 1 감소.
- 첫 보스 클리어 후 움직이는 구멍과 레이저 해금. 5초 고정, 키 수만 보스별 증가.

## Implementation

### I01. Encounter, Challenge and Difficulty Models
- Related Files:
  - `src/game/constants.js` :: 보스 HP/챌린지/쿨다운/해금 상수; modify
  - `src/game/boss.js` :: `createBossEncounter`, `advanceBossEncounter`, `getBossHealth`; modify
  - `src/game/wasd-challenge.js` :: `getDifficulty`, `createChallenge`; modify
  - `src/game/difficulty.js` :: `getDifficulty`; modify
  - `tests/game/boss.test.js`, `tests/game/wasd-challenge.test.js`, `tests/game/difficulty.test.js`; modify
- Signatures: `createBossEncounter(number: number): object`, `advanceBossEncounter(encounter: object, event: string, value?: number): object`, `getBossHealth(number?: number): number` (3 fixed). `createChallenge({bossNumber?: number, rng?: () => number}): object` 유지. `getDifficulty(..., progressionScore = score, firstBossCleared = false): object`로 마지막 optional boolean 추가.
- Fields: Encounter keeps `number, hp, maxHp: number`, `attack: object|null`, `wallSpawningPaused, awaitingNextWave, cleared: boolean`; adds `successfulChallenges: number = 0`, `requiredChallenges: number = 3`, `challengeCount: number = 0` (attempts), `normalWallsSinceAttack: number = 0`, `lastSpecialResolvedAt, lastAttackResolvedAt: number|null = null`, `lastAttackWasLaser: boolean = false`. Remove reflected projectile and conditional extra-challenge counters.
- Events: `challenge-success` increments attempts+successes and updates HP; `challenge-failure` increments attempts only; `normal-wall-passed`, `special-resolved`, `attack-resolved`, `boss-cleared` maintain scheduling, times and clear state. Unknown/cleared events are no-ops.
- Challenge `maxKeys = min(8, 4 + max(1, normalizedBossNumber) - 1)`, sequence length random between `max(3, maxKeys - 2)` and maxKeys. `timeLimitSeconds = 5`, `resolved = false`; retain W/A/S/D and no four repeated keys.
- Moving-gap chance is 0 before first clear regardless of score, 0.5 afterward. Remove obsolete 50-point moving-gap and late HP/extra challenge constants; rename normal-wall cooldown to attack-neutral name. Keep low-level projectile art/geometry helpers unused by gameplay to avoid unrelated renderer/collision changes.

### I02. Runtime Loop and Score
- Related Files:
  - `src/game/game-engine.js` :: difficulty calls, `start`, `processPassedObstacles`, `resolveChallenge`, `scheduleBossAttack`, `updateBossAttack`, `completeBossIfReady`, `dash`, snapshots; modify
  - `tests/game/game-engine.test.js`; modify
- Pass firstBossCleared into every getDifficulty call; initial test seed completedWarningCount>=2 implies prior first clear, and fresh runs reset the flag correctly.
- Mark walls passed once. During active boss skip `advanceScore` for all walls but ALWAYS resolve boss normal/special counts and pending special set, wave completion and stage advancement logic. Outside boss normal scoring unchanged.
- Keep 7-wall wave/minimum normal2+special3 and one-second special/attack cooldown. Schedule challenge after wave complete and no pending specials/attack/active challenge. No active projectile creation or reflection damage in dash.
- From boss2, 25% chance of laser if prior attack wasn't laser. Laser -> next wave -> guaranteed challenge; challenges otherwise remain the default. Laser completion resets cooldown and wave availability; lasers do not damage boss or add success.
- Challenge freezes world update as before. Resolve each terminal challenge once with resolved guard. Success removes 1 HP and sets a short hit effect; failure applies existing 0.75-second random ink/glitch. Reset cooldown counters and resume spawning via a new wave after either result.
- Clear after HP0 and no pending attack/active challenge. Award `score += 10` and `progressionScore += 10` once, set first clear, schedule next WARNING, and preserve two-wall stage advance. Preserve 2-second easing and boss-speed locking.
- Remove runtime snapshots/branches that refer to reflected projectiles and old bonus WASD scheduling.

### I03. Regression Scenarios
- Real-engine tests: first and late bosses require exactly three successful challenges; score/progression stay fixed throughout boss walls and attempts then both gain exactly10; no projectile scheduled, early/late key lengths and fixed time; no challenge overlap with laser/special walls; physics/background freeze; failure/timeout keeps HP and resumes wave/retry; laser available from boss2 with forced challenge afterward; moving gaps locked before first clear even high score and enabled afterward; stage still changes two walls after clear; restart resets unlock state; speed responds to clear bonus and stays locked during boss; pause still cannot lower speed tier.
- Update existing projectile-based integration loops rather than adding parallel obsolete test paths. Keep collision/projectile primitive tests untouched because those are no longer runtime behavior.

## Acceptance Criteria
- [x] WASD 3 successes clears every boss; no runtime projectile or legacy additional challenge.
- [x] Boss wall/attempt scoring frozen, clear gives score+progression10 exactly once.
- [x] Failure/retry, early content gates, freeze/resume, stage advance and smooth speed verified.

## Validation
- `npm test -- --run tests/game/game-engine.test.js tests/game/boss.test.js tests/game/wasd-challenge.test.js tests/game/difficulty.test.js tests/game/score.test.js`
- `npm run build`
- `git diff --check`

## Commit Message
```text
feat(game): replace boss reflections with three WASD victories

Plan: 2026-10-26-wasd-boss-overhaul
Phase: P01-boss-challenges
Task: T01-boss-loop
```

## Progress
- [x] 구현 완료
- [x] 검증 통과 — 5 test files / 63 tests; production build; diff whitespace check.
- commit: pending

## Implementation Notes
- Boss preview remains normal play, so at high speeds an existing wall can score before the preview ends. Score-freeze checks begin at actual encounter entry.
- Both wrong input and timeout retry loops, boss2 laser-to-challenge alternation, first/late boss clear and two-wall stage advance passed in the real engine.
- Runtime projectile scheduling removed; primitive art/geometry helpers remain outside gameplay.

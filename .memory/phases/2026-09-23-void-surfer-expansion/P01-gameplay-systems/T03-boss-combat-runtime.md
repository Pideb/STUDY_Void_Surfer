# Task: T03 Boss Combat Runtime

## Status: done

## Goal

보스 전투를 벽 통과만으로 끝나지 않게 확장한다. 보스 투사체를 Space 대시로 반사해 HP를 깎고, 5번째 이후 레이저 패턴을 처리하며, 3번째 보스부터 무작위 WASD 챌린지를 실행한다. 공격 간 겹침·불가능한 안전 경로·과도한 재발사 없이 기존 장애물 점수 루프와 결합한다.

## Decision Summary

- 보스 1~4는 HP 3, 보스 5 이상은 HP 5이며 반사 1회당 1 HP를 잃고, HP 0에서만 클리어한다. 벽 통과 점수와 보스 클리어 +10점은 유지한다.
- 투사체는 직선 60%/포물선 40%, 속도 `0.7x..1.6x` 랜덤, 0.6초 charge, 약 0.15초 반사 창이다. 성공 시 보스까지 직선으로 돌아가며 피해 연출을 낸다.
- 특수벽과 투사체 응답 창은 1초 이상 분리하고, 투사체 사이에는 일반벽 최소 2개가 지나야 한다.
- 보스 5부터 단일 랜덤 Y 레이저와 4분할 레이저를 추가한다. 레이저와 벽 조합은 항상 안전 경로를 검증한다.
- 보스 3부터 WASD 챌린지를 1~2회 반사 후 시작한다. 3~6은 1회, 7+는 70% 확률로 2회이며 실패는 게임 오버/보스 피해가 아니라 잉크 또는 네온 글리치 피드백이다.

## Implementation

### I01. Boss encounter state and attack scheduling

- Related Files:
  - `src/game/boss.js` :: new `createBossEncounter`, `getBossHealth`, `advanceBossEncounter`
  - `src/game/constants.js` :: boss HP, charge, reflection window, cooldown, laser telegraph constants
  - `src/game/game-engine.js` :: boss state lifecycle and score clear handling; modify
  - `tests/game/boss.test.js` :: new

#### Details

- **BossEncounter fields**:
  ```js
  {
    number: number,
    hp: number,
    maxHp: number,
    reflectedCount: number,
    requiredReflections: number,
    attack: null | BossAttack,
    reflectedProjectile: null | { id: string, progress: number },
    normalWallsSinceProjectile: number,
    lastSpecialResolvedAt: number | null,
    lastProjectileResolvedAt: number | null,
    challengeCount: number,
    targetChallengeCount: number,
  }
  ```
- Initialize HP to `3` for boss numbers `1..4`, else `5`. Boss clear happens once, adds exactly `10` points, and returns to normal mode only after all active boss attacks/effects are resolved.
- Schedule projectile only when no special-wall response is active, no laser/challenge is active, at least two normal walls have passed since the last projectile, and one second has passed since the last special-wall resolution.

### I02. Projectile creation, telegraph, reflection, and damage

- Related Files:
  - `src/game/boss-attacks.js` :: new projectile/laser factories and update functions
  - `src/game/collision.js` :: `isProjectileReflectionSuccess` or equivalent; modify
  - `src/game/game-engine.js` :: attack update and `dash()` resolution; modify
  - `tests/game/boss-attacks.test.js`, `tests/game/collision.test.js` :: new/extend

#### Details

- **Projectile fields**: `{ id, kind: 'direct' | 'parabolic', x, y, startY, targetY, speed, curveAmplitude, chargeRemainingSeconds, reflectionWindowSeconds, state: 'charging' | 'flying' | 'returning' | 'resolved', telegraphPoints, hitPlayer }`.
- Roll kind with 60% direct/40% parabolic. Roll speed uniformly between `0.7 * difficulty.scrollSpeed` and `1.6 * difficulty.scrollSpeed`. During charge, show the muzzle and dotted trajectory; do not move the projectile or spawn a special wall in the same response window.
- `Space` checks the projectile against player x/y at the impact window. Success changes state to `returning`, sets a straight return target at the boss, increments HP damage exactly once, and creates a hit/recoil effect. Failure lets normal collision resolve and ends the run if the projectile hits the player.
- The return projectile must be visible in snapshots until it reaches the boss. Do not delete it at the reflection instant.

### I03. Laser safety and timing patterns

- Related Files:
  - `src/game/boss-attacks.js` :: `createSingleLaser`, `createQuarterLaser`, `findSafeLaserY`
  - `src/game/game-engine.js` :: laser scheduling and wall pause; modify
  - `tests/game/laser-safety.test.js` :: new

#### Details

- Boss 5+ may create one single horizontal laser at a random valid Y. Before accepting it, test the active wall gap and player movement corridor; reroll until at least one safe path remains.
- The quarter-screen attack divides the vertical world into four equal zones, covers three, and marks one safe zone with a 0.7-second telegraph. Set `wallSpawningPaused: true` while active, then schedule the next wall after the short follow-up delay constant.
- A laser object contains `{ kind: 'single' | 'quarter', y, safeZone, telegraphRemainingSeconds, activeRemainingSeconds, styleKey }`. Its collision geometry is independent from its visual shimmer.

### I04. WASD challenge state machine

- Related Files:
  - `src/game/wasd-challenge.js` :: new `createChallenge`, `handleChallengeKey`, `updateChallenge`
  - `src/game/game-engine.js` :: freeze/resume challenge transitions; modify
  - `src/game/input.js` :: route only W/A/S/D while challenge is active; modify
  - `tests/game/wasd-challenge.test.js` :: new

#### Details

- `maxKeys` starts at `4` for boss 3 and scales to `8` by later bosses; `timeLimitSeconds` starts at `5` and scales down to `2.3`; actual sequence length is random in `[max(3, maxKeys - 2), maxKeys]`.
- Generate from `['KeyW','KeyA','KeyS','KeyD']` with a maximum run of three identical keys; repeats are allowed otherwise.
- While active, freeze physics, obstacles, stage timer, and attack movement. Snapshot contains `{ active, sequence, cursor, remainingSeconds, result: 'pending'|'success'|'failure' }`.
- Correct key advances cursor and highlights/clears it. Wrong key or timeout sets failure, applies exactly one randomly selected `ink` or `glitch` effect for a bounded duration, deals no boss damage, and resumes play. A successful sequence resumes without HP change.

## Acceptance Criteria

- [x] Boss clear requires HP depletion by successful reflections and awards +10 once.
- [x] Projectile telegraph, direct/parabolic movement, random speed, 0.15-second reflection window, and visible return path are testable.
- [x] No special wall and projectile response window overlaps within one second; projectile cooldown requires two normal walls.
- [x] Laser generation never removes all safe movement paths and pauses wall spawning during quarter attacks.
- [x] WASD rules, scaling, repeat limit, failure effects, and simulation freeze are deterministic under injected RNG.

## Validation

- `npm run test -- --run tests/game/boss.test.js tests/game/boss-attacks.test.js tests/game/laser-safety.test.js tests/game/wasd-challenge.test.js tests/game/collision.test.js tests/game/game-engine.test.js`
- `npm run build`

## Commit Message

```text
feat(game): add boss combat projectiles lasers and challenges

Plan: 2026-09-23-void-surfer-expansion
Phase: P01-gameplay-systems
Task: T03-boss-combat-runtime

- add projectile reflection and boss HP progression
- add safe laser patterns and frozen WASD challenges
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending

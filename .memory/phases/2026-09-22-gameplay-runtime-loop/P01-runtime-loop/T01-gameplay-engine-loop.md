# Task: T01 Gameplay Engine Loop

## Status: done

## Goal

`createGameEngine`이 실제 장애물 시뮬레이션을 소유해, 플레이 중 생성·이동·충돌·통과 점수·WARNING/BOSS·특수 벽 대시가 하나의 재현 가능한 스냅샷으로 동작하게 한다.

## Decision Summary

- 일반 장애물은 2.0초, WARNING/BOSS는 1.4초마다 생성한다. WARNING은 5개, BOSS WARNING은 7개 장애물로 구성한다.
- WARNING에는 특수 벽 2개, BOSS WARNING에는 3개를 최소 보장한다. 일반 대시 판정은 벽 도착 전 0.5초, WARNING/BOSS는 0.25초다.
- 일반 벽 SPACE는 완전 무효이며, 성공 대시는 선택된 특수 벽 하나의 충돌만 0.6초 동안 무시한다.

## Implementation

### I01. 런타임 상수·난이도·장애물 모델 보강

- Related Files:
  - `src/game/constants.js` :: `NORMAL_SPAWN_INTERVAL_SECONDS`, `WARNING_SPAWN_INTERVAL_SECONDS`, `WARNING_OBSTACLE_COUNT`, `BOSS_OBSTACLE_COUNT`, `WARNING_MIN_SPECIALS`, `BOSS_MIN_SPECIALS`, `OBSTACLE_SPAWN_X`; modify
  - `src/game/difficulty.js` :: `getDifficulty`, `getBossSpeedMultiplier`; modify
  - `src/game/obstacles.js` :: obstacle 이동/통과에 필요한 모델을 유지; read-only unless a small helper is necessary
  - `src/game/collision.js` :: `isSpecialTimingSuccess`; modify
  - `tests/game/difficulty.test.js` :: 고정된 BOSS 패턴·런타임 난이도 경계; modify
  - `tests/game/collision.test.js` :: 대시 사전 도착 시간 창 및 일반 벽 무효 경계; modify

#### Details

- **Signatures & Types**:
  ```javascript
  export function isSpecialTimingSuccess({
    playerX,
    wallX,
    speed,
    windowSeconds,
  }): boolean;

  // DifficultySnapshot is extended only when needed to preserve a selected bossPattern.
  export function getDifficulty(score, elapsedSeconds, warningCount, rng, bossPatternOverride): DifficultySnapshot;
  ```
- `isSpecialTimingSuccess`은 숫자와 `speed > 0`, `windowSeconds >= 0`를 검증한다. `timeUntilWall = (wallX - playerX) / speed`가 `0 <= timeUntilWall <= windowSeconds`일 때만 true다. 과거의 `inputTime` 비교 계약은 제거한다.
- BOSS 패턴은 WARNING 진입 시 한 번만 RNG로 선택하고, 해당 세션 동안 `slow`, `fast`, `shift`가 변하지 않게 한다. `shift`의 속도 전환만 elapsed time에 따라 계속 계산한다.
- 스폰 X 위치는 `WORLD_WIDTH + OBSTACLE_WIDTH`다. gap center는 RNG로 `[gapHeight / 2, WORLD_HEIGHT - gapHeight / 2]` 범위에서 균등 생성한다.

### I02. 프레임 시뮬레이션과 스냅샷

- Related Files:
  - `src/game/game-engine.js` :: `createGameEngine`; modify
  - `tests/game/game-engine.test.js` :: deterministic runtime loop tests; modify

#### Details

- **Signatures & Types**:
  ```javascript
  export function createGameEngine(deps?: {
    now?: () => number;
    gravity?: number;
    initialScore?: number;
    initialCompletedWarningCount?: number;
    rng?: () => number;
  }): {
    start(): void;
    update(nowMs: number): void;
    lift(): boolean;
    dash(): boolean;
    pause(): { score: number };
    resume(): void;
    stop(reason?: string): void;
    getSnapshot(): GameSnapshot;
  };

  // GameSnapshot
  // {
  //   state, score, elapsedSeconds, gameOverReason, player,
  //   obstacles: Obstacle[], difficulty: DifficultySnapshot,
  //   warning: { index, spawnedCount, targetCount, requiredSpecials, remainingSpecials } | null
  // }
  ```
- Engine private state: obstacle array, monotonic `nextObstacleId`, spawn accumulator, `passedObstacleIds: Set<string>`, completed warning count, and nullable warning session `{ index, isBoss, bossPattern, targetCount, spawnedCount, requiredSpecials, specialObstacleIds: Set<string> }`.
- `start()` must reset every runtime collection and spawn accumulator, then enter `PLAYING`. The first obstacle is spawned by the initial accumulator on the first positive update, not by UI code.
- Each playing update clamps delta using `MAX_FRAME_DELTA_SECONDS`, updates player physics, derives current difficulty from score/elapsed/completed warnings and the active frozen boss pattern, adds one or more obstacles while accumulator exceeds the active interval, and moves each obstacle left using `difficulty.scrollSpeed`.
- WARNING session begins immediately after score reaches the next 20/30/40… threshold. It freezes targetCount 5 or 7 and bossPattern. During a session, if `remainingSlots <= remainingSpecialsNeeded`, force `kind: 'special'`; otherwise use existing `shouldSpawnSpecial(rng, difficulty)`. This guarantees two/three special walls without removing normal random variation.
- Check player boundary and obstacle collisions during the same update. First collision must call `stop('obstacle')`; a boundary collision remains `stop('boundary')`. Remove fully offscreen obstacles after processing.
- When an obstacle’s right edge has moved left of the player’s left edge, call `advanceScore` once for its ID. On a new score, evaluate whether to begin WARNING. For a warning-session special wall, remove its ID from `specialObstacleIds` only when that wall is actually passed.
- End a warning session only when its `spawnedCount === targetCount` and every required special ID has passed. Increment completed warning count exactly once, then return to normal difficulty.
- `dash()` runs only in `PLAYING`: find the nearest not-yet-passed special wall ahead of `player.x`, test `isSpecialTimingSuccess` with current `difficulty.scrollSpeed` and timing window, and call `startDash(player, DASH_DURATION_SECONDS, obstacle.id)` only on success. Return `true` only then; normal walls, too-early inputs, and missing targets return `false`. `update()` calls `advanceDash(player, deltaSeconds)` so its target-specific collision immunity expires.
- `getSnapshot()` must clone `player`, `obstacles`, `difficulty`, and scalar warning fields so renderer/UI cannot mutate engine state.

### I03. Regression coverage

- Related Files:
  - `tests/game/game-engine.test.js` :: runtime state transitions; modify
  - `tests/game/collision.test.js` :: timing window boundary; modify
  - `tests/game/difficulty.test.js` :: boss pattern override; modify

#### Details

- Inject a deterministic RNG sequence and controlled `now` values; never assert random outcomes without injection.
- Cover first spawn, 2.0/1.4-second cadence, leftward movement, in-gap passage scores once, obstacle collision, boundary collision, special lock before score 10, normal SPACE false, early/late special SPACE false, successful target dash immunity and expiry.
- Drive score to 20 using passed obstacle IDs, assert WARNING 5 walls / at least 2 specials / 135px gap; complete it and assert normal mode resumes. Drive completed warning count to the fifth threshold and assert BOSS 7 walls / at least 3 specials / a frozen selected pattern and correct multiplier.

## Acceptance Criteria

- [x] 실제 `update()` 호출에서 장애물이 일반 2.0초, WARNING/BOSS 1.4초 간격으로 생성·좌측 이동한다.
- [x] 장애물 충돌은 `gameOverReason: 'obstacle'`, 화면 경계 충돌은 `'boundary'`가 된다.
- [x] 장애물 하나당 정확히 1점이며, 20점 이후 WARNING 5개·BOSS 7개와 최소 특수 벽 수가 보장된다.
- [x] 일반 SPACE는 false/무효이고, 특수 벽 도착 전 0.5초·0.25초 창에서만 대시가 성공한다.
- [x] 스냅샷이 renderer의 `obstacles`와 `difficulty` 요구 필드를 제공하고 외부 변경으로 엔진 상태가 오염되지 않는다.

## Validation

- `npm run test -- --run tests/game/game-engine.test.js tests/game/collision.test.js tests/game/difficulty.test.js tests/game/obstacles.test.js tests/game/score.test.js` — 실제 루프와 순수 규칙 회귀 통과
- `npm run test -- --run` — 전체 UI/통합 테스트 통과
- `npm run build` — production build 성공

## Commit Message

```text
feat(game): run obstacles collisions scores and warning boss loops

Plan: 2026-09-22-gameplay-runtime-loop
Phase: P01-runtime-loop
Task: T01-gameplay-engine-loop

- simulate deterministic obstacle spawning, collision, and scoring each frame
- enforce warning/boss segments and targeted special-wall dashes
```

## Progress

- [x] 구현 완료
- [x] 검증 통과
- commit: recorded in git history

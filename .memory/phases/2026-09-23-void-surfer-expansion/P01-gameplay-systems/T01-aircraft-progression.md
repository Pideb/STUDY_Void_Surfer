# Task: T01 Aircraft Progression

## Status: done

## Goal

세 기체를 공통 히트박스로 모델링하고, 계정 최고 점수에 따른 해금·선택·성능 보정을 게임 엔진에 주입한다. 기본 기체는 즉시 사용 가능하고, AEGIS 정밀/중량 기체는 최고 점수 50점, VELOCITY 고속 기체는 100점에서 해금한다.

## Decision Summary

- `default`, `velocity`, `aegis` 세 기체는 동일한 `PLAYER_WIDTH`/`PLAYER_HEIGHT` 히트박스를 사용한다.
- VELOCITY는 장애물·보스 투사체 이동 속도와 생성 리듬을 2배, 벽 통과 점수를 2배로 하며 플레이어 중력/상승은 기본과 같다.
- AEGIS는 중력 2배, 클릭 상승력은 기본 상승력의 35%, 점수와 벽 생성 규칙은 기본과 같다.
- 해금은 Supabase 계정 최고 점수로 계산하며 로컬 저장소에 진행도를 복제하지 않는다.

## Implementation

### I01. Aircraft catalog and deterministic unlock rules

- Related Files:
  - `src/game/aircraft.js` :: new `AIRCRAFT_IDS`, `AIRCRAFT_CATALOG`, `getAircraftDefinition`, `getUnlockedAircraftIds`, `isAircraftUnlocked`
  - `src/game/constants.js` :: new aircraft multiplier/unlock constants
  - `tests/game/aircraft.test.js` :: new unit tests

#### Details

- **Types and fields**:
  ```js
  // AircraftDefinition
  {
    id: 'default' | 'velocity' | 'aegis',
    name: string,
    unlockBestScore: number,
    scoreMultiplier: number,
    scrollSpeedMultiplier: number,
    spawnIntervalMultiplier: number,
    gravityMultiplier: number,
    liftMultiplier: number,
    visualKey: 'default' | 'velocity' | 'aegis',
  }
  ```
- Catalog values are exactly: default `{ unlockBestScore: 0, scoreMultiplier: 1, scrollSpeedMultiplier: 1, spawnIntervalMultiplier: 1, gravityMultiplier: 1, liftMultiplier: 1 }`; velocity `{ unlockBestScore: 100, scoreMultiplier: 2, scrollSpeedMultiplier: 2, spawnIntervalMultiplier: 0.5, gravityMultiplier: 1, liftMultiplier: 1 }`; aegis `{ unlockBestScore: 50, scoreMultiplier: 1, scrollSpeedMultiplier: 1, spawnIntervalMultiplier: 1, gravityMultiplier: 2, liftMultiplier: 0.35 }`.
- `getUnlockedAircraftIds(bestScore)` always includes `default`, clamps invalid/negative scores to zero, and returns IDs in catalog order.
- Unknown aircraft IDs normalize to `default`; definitions are frozen to prevent runtime mutation.

### I02. Apply selection to the engine without changing the shared hitbox

- Related Files:
  - `src/game/game-engine.js` :: `createGameEngine`, `start`, `lift`, `getCurrentDifficulty`, `getSnapshot`; modify
  - `src/game/player.js` :: `applyLift` or a new multiplier parameter; modify
  - `src/game/score.js` :: `advanceScore` multiplier support; modify
  - `tests/game/game-engine.test.js` and `tests/game/score.test.js` :: extend

#### Details

- `createGameEngine(deps)` accepts `deps.aircraftId` and normalizes it through `getAircraftDefinition`; expose `setAircraft(id)` only while not playing, returning the normalized ID.
- `start()` resets the selected aircraft for the run but does not reset account best score. `getSnapshot()` returns `aircraft: { id, name, scoreMultiplier, gravityMultiplier, liftMultiplier }` and keeps `player.width/height` equal to the shared constants for all IDs.
- Use `gravity * aircraft.gravityMultiplier` in every playing update. Use `LIFT_VELOCITY * aircraft.liftMultiplier` in `lift()`.
- Apply `scrollSpeedMultiplier` to obstacle/projectile/hazard movement and use `spawnIntervalMultiplier` to the normal and WARNING/BOSS spawn intervals. A 2x aircraft therefore uses half the interval; it must not alter the 1.6-second WARNING/BOSS moving-gap cycle itself.
- Multiply only wall-pass points by `scoreMultiplier`; pause penalty, boss-clear fixed reward, and non-wall events are not multiplied.
- Reject changing aircraft during `PLAYING`, `PAUSED`, or `GAME_OVER`; the controller will change it from the hangar before a run.

### I03. Account best-score adapter contract

- Related Files:
  - `src/services/leaderboard-service.js` :: `fetchPlayerBestScore` new exported service method
  - `src/ui/app-controller.js` :: state fields `selectedAircraftId`, `accountBestScore`, `unlockedAircraftIds`; modify later only enough to consume the service contract
  - `tests/services/leaderboard-service.test.js` :: new/extended tests

#### Details

- `fetchPlayerBestScore(client)` calls the existing authenticated best-score RPC or a narrowly scoped `get_player_best_score` RPC and returns `{ bestScore: number, error: null }` or `{ bestScore: 0, error }`.
- The method must never expose a service role key, accept an arbitrary user ID, or persist score data in `localStorage`.
- If the service is unavailable, the UI keeps `default` selected and reports a non-fatal unlock-data error; gameplay remains playable.

## Acceptance Criteria

- [x] The catalog and unlock thresholds are deterministic and unit-tested.
- [x] All three aircraft have identical player hitbox dimensions.
- [x] VELOCITY doubles wall score and movement/spawn rhythm; AEGIS uses gravity `2` and lift `0.35`.
- [x] Invalid or locked selections cannot start a run.
- [x] Existing default-aircraft tests remain green.

## Validation

- `npm run test -- --run tests/game/aircraft.test.js tests/game/game-engine.test.js tests/game/score.test.js tests/services/leaderboard-service.test.js`
- `npm run build`

## Commit Message

```text
feat(game): add aircraft progression and performance profiles

Plan: 2026-09-23-void-surfer-expansion
Phase: P01-gameplay-systems
Task: T01-aircraft-progression

- add default, velocity, and aegis aircraft definitions
- apply account-score unlocks and shared hitbox performance modifiers
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending

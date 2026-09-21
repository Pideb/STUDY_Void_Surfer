# Task: T03 Obstacles and Difficulty

## Status: pending

## Goal

일반·특수 벽 생성, 10점 해금, 점진적 속도 증가, 점수 통과, WARNING과 BOSS 규칙을 순수 함수 중심으로 구현하고 충돌 판정을 재현 가능하게 만든다.

## Decision Summary

- 일반 특수 벽 확률은 20%, WARNING 중 50%; 첫 WARNING은 20점 이후 10점마다 시작한다.
- WARNING 틈은 기본의 75%, 특수 판정은 평상시 ±0.5초·WARNING ±0.25초이며, 매 5번째 WARNING은 BOSS다.

## Implementation

### I01. 난이도·장애물 스폰 모델

- Related Files:
  - `src/game/difficulty.js` :: speed tier, warning, boss 계산; new
  - `src/game/obstacles.js` :: normal/special obstacle 생성 및 이동; new
  - `src/game/constants.js` :: spawn spacing, gap, probability 상수 확장; modify
  - `tests/game/difficulty.test.js` :: 점수·시간 경계 테스트; new
  - `tests/game/obstacles.test.js` :: 생성·확률 주입·모델 테스트; new

#### Details
- **Signatures & Types**:
  ```javascript
  export function getBaseSpeed(elapsedSeconds: number): number;
  export function getDifficulty(score: number, elapsedSeconds: number, warningCount: number): DifficultySnapshot;
  export function createObstacle({ id, x, gapCenter, gapHeight, kind, warningIndex, rng }): Obstacle;
  export function shouldSpawnSpecial(rng: () => number, difficulty: DifficultySnapshot): boolean;
  export function updateObstacle(obstacle, deltaSeconds: number, speed: number): void;
  ```
- `getBaseSpeed`는 20초 tier마다 이전 tier보다 10% 증가한다. BOSS multiplier는 base speed에 곱한다.
- score 10 미만은 special을 생성하지 않는다. score 10 이상 일반 구간은 0.2, warning은 0.5 확률을 사용한다. RNG는 인자로 받아 테스트에서 deterministic하게 만든다.
- 하나의 obstacle은 위·아래 구조물과 하나의 gap을 가지며 `gapHeight`는 normal 기본값, warning/boss에서는 `baseGapHeight * 0.75`다.
- `warningCount`가 0이고 score가 20 미만이면 WARNING이 아니다. WARNING 시작 임계치는 20, 30, 40...이며 현재 warning에서 생성된 special obstacle을 모두 통과하면 종료한다.
- 5번째·10번째 WARNING 등 `warningIndex % 5 === 0`에서 BOSS를 활성화하고, 패턴은 seeded/random 선택으로 `slow=0.5`, `fast=1.8`, `shift=0.5↔1.8` 중 하나다.

### I02. 충돌·대시 판정과 점수 이벤트

- Related Files:
  - `src/game/collision.js` :: AABB 충돌, gap 통과, special timing window; new
  - `src/game/score.js` :: 통과 점수와 best score 후보 계산; new
  - `tests/game/collision.test.js` :: 일반 벽·특수 벽·대시 경계; new
  - `tests/game/score.test.js` :: 중복 통과·점수 경계; new

#### Details
- **Signatures & Types**:
  ```javascript
  export function intersectsPlayerObstacle(player, obstacle): boolean;
  export function isSpecialTimingSuccess({ playerX, wallX, speed, inputTime, windowSeconds }): boolean;
  export function startDash(player, durationSeconds: number): void;
  export function advanceScore(session, obstacleId: string): boolean;
  ```
- SPACE는 현재 화면에서 가장 가까운 special wall 하나에만 판정한다. normal wall에는 success effect가 없고, 대시 중 충돌 무시는 special wall 한 개의 통과에만 적용한다.
- timing window는 실제 벽까지 남은 시간 기준으로 계산하고, 평상시 `0.5`, warning/boss `0.25`를 사용한다. 경계값 포함 여부는 `<=`로 통일한다.
- obstacle id별 통과 이벤트를 Set으로 중복 제거하여 한 obstacle당 1점만 부여한다.
- 일반 충돌은 player bounds와 obstacle solid bounds의 AABB로 판정한다. gap 내부에 있을 때는 구조물과 충돌하지 않는다.

## Acceptance Criteria

- [ ] score 10 전 special이 생성되지 않고, 10 이후 확률이 normal 20%로 적용된다.
- [ ] 20점·30점·40점에서 WARNING 임계가 정확히 동작하고, warning 중 gap 75%·special 50%가 적용된다.
- [ ] 매 5번째 WARNING이 BOSS가 되고 세 가지 speed pattern 중 하나가 선택된다.
- [ ] 일반 벽 SPACE 무효, special timing 성공 시 0.6초 대시, timing 실패 시 충돌 가능 상태가 테스트된다.
- [ ] 동일 장애물 통과가 중복 점수화되지 않는다.

## Validation

- `npm run test -- --run tests/game/difficulty.test.js tests/game/obstacles.test.js tests/game/collision.test.js tests/game/score.test.js` — 난이도·충돌·점수 통과

## Commit Message

```text
feat(game): add obstacles warning and boss difficulty

Plan: 2026-09-21-void-surfer
Phase: P01-game-core
Task: T03-obstacles-difficulty

- add normal and special obstacle generation with score unlock
- add warning timing windows, gap reduction, and boss speed patterns
```

## Progress

- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending

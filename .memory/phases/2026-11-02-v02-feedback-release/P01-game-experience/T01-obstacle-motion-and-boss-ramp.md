# Task: T01 이동 구멍 정지·보스 벽 난이도·특수벽 판정

> 이 작업은 [v0.2 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md)에 포함된다. 아래 기존 게임·시각 결정 링크는 원래 승인 세부를 보존한다. 버전·임시 해금·첫3보스·회전·메뉴·기록에 관한 충돌은 v0.2 통합 결정이 우선한다.

## Status: done

## Goal
구멍이 등장부터 움직이다 플레이어 앞160px에서 멈추며, 첫 보스는 일반 벽 난이도와 동일하고 특수벽 성공 시간은 끝까지0.30초가 된다.

## Decision Summary
- D01/D14/D19 및 최종결정§1~2. 움직이는 벽의 외형 교체는 T06, 차수별 공격 해금은 T05. 속도/스폰 안전 보정은 유지한다.
- 선행 구현 없음. 현재0.01-b 코드에서 시작.
- [최종 결정](../../../decisions/2026-11-02-v01-gameplay-visual-polish.md). 범위 밖 물리·점수·계정·배포 변경 없음.
- world960×540 논리좌표, 실제화면의 CSS/물리픽셀과 구분. 프리뷰 fixture는 본게임 로직이 아니다.

## Implementation

### I01. 이동 구멍 정지·보스 벽 난이도·특수벽 판정

- Related Files:
  - `src/game/obstacles.js` :: `createObstacle / updateObstacle / clampGapCenter` — modify
  - `src/game/constants.js` :: `NORMAL_TIMING_WINDOW_SECONDS / WARNING_TIMING_WINDOW_SECONDS / boss constants` — modify
  - `src/game/difficulty.js` :: `getDifficulty / getBossWallRules (new)` — modify
  - `src/game/game-engine.js` :: `beginWarningSession / spawnObstacle / updateSpawning / update` — modify
  - `src/game/collision.js` :: `isSpecialTimingSuccess / success bounds` — read-only
  - `src/game/renderer.js` :: `getTimingGuideWidth / first-boss guide ownership` — read-only

#### Details
- **Signatures & Types** (JS 구현의 계약 명세이며 TypeScript 전환 요청 아님):
```typescript
type MotionState = { motionAgeSeconds:number; motionFrozen:boolean; motionCenter:number; motionPhase:number };
updateObstacle(obstacle:Obstacle, dt:number, speed:number, elapsed:number, options?:{playerDamageFront:number}):void;
getBossWallRules(bossNumber:number):{gapHeight:number;spawnIntervalSeconds:number;specialChance:number;minSpecials:number;timingWindowSeconds:number};
```
- **Data & Schema Fields**: Obstacle 추가 필드는 motionAgeSeconds=0, motionFrozen=false, motionCenter와 motionPhase 유한 숫자이며 모두 비null이다. movingGap=false에는 영향을 주지 않는다. bossNumber=completedBossCount+1. rules는 첫 보스180/2/.2/0/.30, 두 번째 이상135/1.4/.5/3/.30. DB·영구저장 변경 없음.
- **Execution Flow / Logic**:
  1. 기존 4인자 호출을 보존하고 실엔진만 playerDamageFront=player.x+damageHalfWidth를 전달한다. distance=wall.x-playerDamageFront를 논리px로 계산한다.
  2. 생성 중심과 첫 샘플을 같은 위상으로 초기화한다. clamp로 파형이 경계에서 수초 정체되지 않게 진폭 가능한 범위 안에 중심/위상을 만든다. 진입부터 움직임을 보이되 순간 도약 금지.
  3. distance>160에서 모션 시간을 누적, 마지막40px에 smooth 감속하는 시안 적분 방식을 구현 초안으로 사용한다. 한 dt가 경계를 넘어도 정확히 정지점까지만 적분한다. distance<=160이면 frozen=true를 단방향 확정한다. 수평x 이동은 계속.
  4. getBossWallRules를 difficulty와 spawning/최소할당 양쪽에서 사용하여 화면 구멍만 커지고 생성/강제특수 비율은 옛 보스값인 불일치를 막는다. 기존7개 wave 및 VELOCITY.5 생성배율 후 안전 보정 보존.
  5. 활성 보스 판정 .15 축소를 제거하고 모든 특수/혼합 성공 .30 사용. 기존 축소 값은 비활성 archive 주석/연구기록으로 보존한다. 뒤로 간 벽의 이미 고정된 안내 폭을 재계산하지 않는다.
  6. 오류/재시작 시 새 obstacle 모션 초기화. 유효하지 않은 dt/속도는 기존 update 계약대로 처리하며 NaN을 만들지 않는다. 영구 frozen만 snapshot에 복사한다.
- **Error / state boundary**: 예외·재시작·무효입력 처리는 위 흐름대로 기존 게임을 멈추거나 다른 run 상태를 덮어쓰지 않아야 한다. 새 DB migration/외부 계정 설정 없음.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/game/obstacles.test.js` :: `T01 behavioral coverage` — modify
  - `tests/game/difficulty.test.js` :: `T01 behavioral coverage` — modify
  - `tests/game/barrier-spacing.test.js` :: `T01 behavioral coverage` — modify
  - `tests/game/barrier-flow.test.js` :: `T01 behavioral coverage` — modify
  - `tests/game/game-engine.test.js` :: `T01 behavioral coverage` — modify

#### Details
- 240/460/700/770 px/s와 dt1/60·1/30·큰dt에서 x408 정지, 진입 첫 프레임 연속, 통과 후 수직정지/수평이동, 다른 벽 불변. boss1/2 생성간격·최소특수·양쪽 success box 접촉 .30 검증. 이동벽끼리 공유 모션 상태 금지.
- 테스트는 구현 코드의 줄별 복제가 아니라 관찰 가능한 상태전이/입력/충돌/시각 결과를 검사한다.
- 미실행 항목은 limitation으로 기록한다. 승인되지 않은 새 디자인/밸런스가 필요하면 기존 승인을 확대 해석하지 말고 증거를 제시한다.

## Acceptance Criteria
- [x] 모든 속도에서 접근160px 이후 구멍 중심이 더 변하지 않는다.
- [x] 첫 보스 벽 난이도는 일반과 같고 모든 보스 특수 성공 시간은.30이다.
- [x] 지정 검증 통과와 증거/제약 기록, 무관한 소스·계정·배포 변경 없음.

## Validation
- `npm test -- --run tests/game/obstacles.test.js tests/game/difficulty.test.js tests/game/barrier-spacing.test.js tests/game/barrier-flow.test.js tests/game/game-engine.test.js` — 종료코드0 및 대상 검증 통과.

## Commit Message
```text
fix(obstacles): freeze approaching gaps and apply staged boss wall rules

Plan: 2026-11-02-v02-feedback-release
Phase: P01-game-experience
Task: T01-obstacle-motion-and-boss-ramp

- 이동 구멍 정지·보스 벽 난이도·특수벽 판정 적용 및 경계 사례 검증
- 승인 결정과 기존 게임 규칙 보존
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: see Git log (Task header)

## Validation evidence
- Targeted Vitest: 5 files / 115 tests passed. Speeds240/460/700/770 and boundary crossing covered. No deployment or account changes.

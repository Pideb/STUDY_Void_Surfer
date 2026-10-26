# Task: T01 Boss Bonus and Speed Smoothing

## Status: done

## Goal
보스 클리어 점수 10점은 유지하면서 속도 계산에서 제외하고, 속도 변화의 양 끝을 완만하게 만들어 대응 시간을 늘린다.

## Decision Summary
- 보너스와 벽 통과의 점수 경로를 구별한다. 벽 통과만 진행 점수를 증가시킨다.
- 모든 속도 전환은 2초 smoothstep 보간을 사용한다. 기존 보스 진입 기준 속도 잠금과 변속 주기는 유지한다.

## Implementation

### I01. Score and Transition Behavior
- Related Files:
  - `src/game/constants.js` :: `SPEED_TRANSITION_SECONDS` — 2초로 수정; modify
  - `src/game/game-engine.js` :: `completeBossIfReady`, `advanceSpeedTransition`, `syncSpeedTransition` — 보너스 분리 및 보간; modify
  - `src/game/score.js` :: `advanceScore` — 벽 통과 점수 경로; read-only

#### Details
- Signatures & Types: `completeBossIfReady(): void`, `advanceSpeedTransition(deltaSeconds: number): void`, `syncSpeedTransition(targetSpeed: number): void` 유지.
- Data & Schema Fields: `scoreSession.score: number`, `scoreSession.progressionScore: number`는 기존 비음수 정수. 새 필드 없음. `speedTransition`의 `fromSpeed`, `targetSpeed`, `elapsedSeconds`, `durationSeconds: number`, `direction: 'up' | 'down'` 유지.
- Execution Flow / Logic:
  1. 보스 체력/공격/챌린지 완료 조건을 그대로 검사한다.
  2. 보너스 지급 시 `scoreSession.score += 10`만 유지하고 `progressionScore += 10`을 삭제한다. 다음 WARNING 기준, 보스 종료, 2벽 후 스테이지 변경은 기존 처리한다.
  3. 전환 진행률 `p = elapsedSeconds / durationSeconds`에 `eased = p * p * (3 - 2 * p)`를 적용하고 `fromSpeed + (targetSpeed - fromSpeed) * eased`로 계산한다.
  4. 목표가 바뀌면 기존대로 현재 속도를 출발점으로 사용한다. 완료 시 목표에 정확히 맞추고 전환을 null로 정리한다. 잘못된 목표 속도는 기존처럼 무시한다.

### I02. Regression Validation
- Related Files:
  - `tests/game/game-engine.test.js` :: 기존 실제 보스 클리어/스테이지 전환 테스트 및 속도 테스트; modify
- 보스전 실제 벽 회피·투사체 반사 루프에서 클리어 순간 `score` 증가분은 `progressionScore` 증가분보다 정확히 10 크고, `progressionScore` 증가분은 해당 프레임의 벽 통과 개수뿐임을 확인한다.
- 9→10 진행 점수 전환에서 첫 스냅샷의 속도 연속성, 2초 동안의 단조 증가, 시작/종료 구간의 작은 변화량, 중간의 더 큰 변화량, 최종 목표 및 HUD 표시 종료를 확인한다.
- 저속/고속 보스 진입에서 실제 속도가 튀지 않고 목표까지 2초 동안 감소/증가하는지 검증한다. 변속 보스의 목표 변경 순간에도 직전 실제 속도를 유지하는지 확인한다.
- 기존 일시정지·기체 배율·스테이지 변경·보스 기준 속도 잠금 테스트를 유지한다.

## Acceptance Criteria
- [x] 보스 클리어 점수는 10 증가하지만 속도용 진행 점수에는 들어가지 않는다.
- [x] 가속·감속이 2초 동안 시작·종료 시 완만하게 전환되고 목표 변경 시 속도가 튀지 않는다.
- [x] 보스 클리어와 기체·일시정지·HUD 회귀 검증 및 프로덕션 빌드 통과.

## Validation
- `npm test -- --run tests/game/game-engine.test.js tests/game/difficulty.test.js tests/game/score.test.js tests/ui/game-hud.test.js` — 관련 엔진/난이도/점수/HUD 검증 통과.
- `npm run build` — 프로덕션 빌드 통과.
- `git diff --check` — 공백 오류 없음.

## Commit Message
```text
fix(game): exclude boss bonuses from speed and ease transitions

Plan: 2026-10-26-boss-bonus-speed-smoothing
Phase: P01-speed-progression
Task: T01-bonus-and-smoothing

- Keep boss clear bonuses out of speed progression
- Ease acceleration and deceleration over two seconds
- Verify boss completion and speed transitions in the real engine
```

## Progress
- [x] 구현 완료
- [x] 검증 통과 — 관련 4파일 59개 테스트, 프로덕션 빌드, diff 공백 검사 통과.
- commit: pending

## Validation Notes
- 변경 전 보스 보너스·2초 곡선·저속/고속/변속 경계 검증 5개가 실패함을 확인한 뒤 수정 후 통과했다.
- 실제 보스 반사 루프에서 보너스 10점과 벽 통과 진행 점수 분리를 검증했다.
- 체감 난이도와 시각적 부드러움의 최종 평가는 실플레이 피드백이 필요하다.
- 추가 범위 변경 및 새 인접 문제 발견 없음.

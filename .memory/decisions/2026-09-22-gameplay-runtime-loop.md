# Decisions: Gameplay Runtime Loop

- Date: 2026-09-22
- Status: Confirmed

## D01. 장애물 생성 주기

- **Chosen**: 일반 구간은 2.0초마다, WARNING/BOSS 구간은 1.4초마다 장애물을 생성한다.
- **Rationale**: 이동 속도가 증가해도 다음 벽까지의 반응 시간을 예측 가능하게 유지하면서, 위험 구간은 더 조밀하게 만든다.

## D02. WARNING 구간 길이

- **Chosen**: WARNING은 5개, BOSS WARNING은 7개의 장애물로 구성한다. 해당 구간에서 생성된 특수 벽을 모두 통과하면 WARNING을 종료한다.
- **Rationale**: 종료 조건이 무한히 늘어나지 않으며, BOSS가 일반 WARNING보다 길고 명확한 이벤트가 된다.

## D03. 특수 벽 최소 수

- **Chosen**: WARNING에는 특수 벽을 최소 2개, BOSS WARNING에는 최소 3개 보장한다. 50% 확률 생성 결과가 부족하면 구간 후반의 일반 벽을 특수 벽으로 바꾼다.
- **Rationale**: 확률상 특수 벽이 전혀 없거나 너무 적어 WARNING의 핵심 대시 규칙이 사라지는 경우를 막는다.

## D04. 특수 벽 대시 타이밍

- **Chosen**: 가장 가까운 특수 벽의 앞면이 플레이어에 도달하기 전 남은 시간이 일반 구간 0.5초, WARNING/BOSS 0.25초 이내일 때만 SPACE 대시가 성공한다.
- **Rationale**: 충돌 이후의 모호한 입력을 허용하지 않고, 속도가 변해도 시간 기준으로 일관된 정확도 요구를 제공한다.

## D05. 기존 결정의 런타임 적용

- **Chosen**: 일반 벽 SPACE는 무효이며, 대시는 성공한 특수 벽 한 개에만 충돌 무시를 적용한다. 장애물의 화면 왼쪽 통과는 장애물 ID별로 한 번만 점수화한다.
- **Rationale**: 기존 `collision.js`, `score.js`, `difficulty.js`의 순수 함수 계약과 사용자에게 안내한 게임 규칙을 그대로 유지한다.

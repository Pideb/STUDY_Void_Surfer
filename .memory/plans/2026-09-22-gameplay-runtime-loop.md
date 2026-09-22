# Plan: Gameplay Runtime Loop

## Goal

기존의 순수 난이도·충돌·점수 함수를 실제 `createGameEngine` 프레임 루프에 연결한다. 플레이 중 장애물이 정해진 시간 간격으로 생성·이동하고, 충돌과 통과 점수, WARNING/BOSS 구간, 특수 벽 대시가 게임 스냅샷과 Canvas/UI에 반영되어야 한다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | 런타임 게임 시뮬레이션과 입력·피드백 연결 | [P01](../phases/2026-09-22-gameplay-runtime-loop/P01-runtime-loop/phase.md) |

## Implementation Order

1. 엔진이 장애물·점수·경고 세션·대시를 단일 프레임 상태로 소유하게 만든다.
2. UI 입력과 오디오 피드백이 실제 엔진 대시 성공 여부 및 WARNING/BOSS 상태를 따르게 만든다.

## Cross-cutting Constraints

- T10 배포 문서 Task는 기존 P03에 보존하며, 이번 런타임 보완이 끝난 뒤 다시 진행한다.
- 일반 벽의 SPACE 입력은 상태와 오디오 효과를 바꾸지 않는다.
- RNG는 의존성 주입으로 고정 가능해야 하며, 테스트가 `Math.random`에 의존하지 않아야 한다.
- WARNING/BOSS의 특수 벽 최소 보장은 50% 확률 생성 뒤 남은 후반 슬롯을 특수 벽으로 강제하는 방식으로 구현한다.

# Phase: P01-game-experience 게임·피드백 UI

## Goal
게임·피드백 UI을 독립 검증·커밋 가능한 Task 순서로 완료한다.

## Decisions
[통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md)

## Tasks
| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | done | 이동 구멍 정지·보스 벽 난이도·특수벽 판정 | [01](./T01-obstacle-motion-and-boss-ramp.md) |
| T02 | done | WASD 오입력 피드백·시간·복귀 보호 | [02](./T02-challenge-input-and-recovery.md) |
| T03 | done | 네 가지 시각 페널티·강한 글리치 | [03](./T03-vision-penalty-effects.md) |
| T04 | done | 실제 발사 순간 기준 투사체 속도 | [04](./T04-projectile-launch-speed.md) |
| T05 | done | 6지역 고유 공격·차수별 공격 해금 | [05](./T05-unique-boss-attack-blocks.md) |
| T06 | in_progress | 승인 v3 아트·이동벽 선택·파괴 부분 선 제거 | [06](./T06-approved-art-and-wall-breach.md) |
| T07 | pending | 모바일 조작·ArrowUp·대기 문구·현재 버전 | [07](./T07-mobile-input-and-menu-status.md) |
| T08 | pending | HUD·동일 프레임 레이어 재사용 최적화 | [08](./T08-quality-preserving-performance.md) |
| T09 | pending | v0.2 버전·임시 해금·보스 순서와20/15벽 간격 | [09](./T09-feedback-unlocks-and-version-policy.md) |
| T10 | pending | 모든 메뉴 방향키·Space 탐색 | [10](./T10-keyboard-menu-navigation.md) |
| T11 | pending | 게임오버 재시작 입력·암전 안내·점수 저장 수명 | [11](./T11-game-over-restart-and-save-lifetime.md) |
| T12 | pending | PC 비율·모바일 확대·회전 중단과 수동 복귀 | [12](./T12-responsive-menu-and-orientation-suspension.md) |

## Progress
- done: 5/12
- in_progress (active:T06)
- 실제 배포 완료와 개발 Task 완료를 구분한다.

# Plan: VOID SURFER Gameplay and Visual Expansion

## Goal

통합된 VOID SURFER 확장 작업을 완료한다. 세 기체 선택·해금·밸런스, 여섯 스테이지의 랜덤 테마와 전체 화면 배경, 스테이지별 장애물·보스·투사체·레이저, 보스 반사 전투와 WASD 챌린지, 메뉴·리더보드·오디오 피드백을 현재 Canvas/DOM/Supabase 구조에 연결한다. 기존에 완료된 게임 코어·인증·리더보드·메뉴 폴리시 작업은 재실행하지 않고, 아직 코드에 없는 `aircraft-boss-gameplay` 결정과 그에 필요한 데이터·렌더링·검증만 실행한다.

## Source Decisions

- [Aircraft and Boss Gameplay](../decisions/2026-09-23-aircraft-boss-gameplay.md)
- [Gameplay Refinements](../decisions/2026-09-22-gameplay-refinements.md)
- [Gameplay Runtime Loop](../decisions/2026-09-22-gameplay-runtime-loop.md)
- [Menu and Dash Feedback](../decisions/2026-09-22-menu-dash-feedback.md)
- [Warning Difficulty Feedback](../decisions/2026-09-22-warning-difficulty-feedback.md)

## Superseded Plan Handling

- `2026-09-22-gameplay-refinements`와 `2026-09-22-menu-dash-feedback`의 pending 문서는 이미 `gameplay-experience-refinements`에 통합된 과거 포인터이므로 직접 실행하지 않는다.
- 기존 완료 커밋에 포함된 특수벽·대시·WARNING·메뉴·BGM 동작은 회귀 테스트 대상으로만 다룬다.
- 이 계획은 2026-09-23에 확정된 기체·보스·스테이지 디자인 및 아직 구현되지 않은 런타임 확장만 추가한다.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | 기체·스테이지·보스 전투 도메인과 게임 엔진 상태를 구현한다. | [P01](../phases/2026-09-23-void-surfer-expansion/P01-gameplay-systems/phase.md) |
| P02 | `done` | 여섯 테마의 Canvas 렌더링, 메뉴/행거/HUD, 오디오 피드백을 연결한다. | [P02](../phases/2026-09-23-void-surfer-expansion/P02-visual-ui-audio/phase.md) |
| P03 | `in_progress` | Supabase 리더보드 확장, 통합 검증, 배포 문서를 마무리한다. | [P03](../phases/2026-09-23-void-surfer-expansion/P03-data-qa-deployment/phase.md) |

## Cross-cutting Constraints

- Canvas 논리 크기 `960x540`과 기존 DOM UI 접근성 계약을 유지한다.
- 기존 동일 히트박스 원칙을 유지한다. 기체 외형과 시각적 일렁임은 충돌 geometry를 변경하지 않는다.
- 일반벽 통과 점수와 기존 일시정지 `-10` 규칙을 유지한다.
- 특수벽과 투사체의 응답 창은 최소 1초 분리하고, 같은 타이밍에 불가능한 조합을 생성하지 않는다.
- 보스 투사체·레이저·WASD 챌린지는 결정론적 RNG 주입으로 테스트할 수 있어야 한다.
- 저작권 있는 음악·캐릭터·이미지를 번들하지 않는다. 기존 procedural audio와 코드 기반 Canvas 도형을 우선 사용한다.
- Supabase 비밀키는 저장소에 기록하지 않고 `.env.local`만 사용한다.

## Implementation Order

1. P01에서 순수 모델과 엔진 상태를 구현해 기체, 스테이지, 보스 공격이 독립적으로 테스트되게 한다.
2. P02에서 snapshot 계약을 기준으로 렌더러·HUD·메뉴·오디오를 연결한다.
3. P03에서 리더보드 스키마/서비스와 전체 회귀 검증을 완료한 뒤 빌드·배포 문서를 갱신한다.

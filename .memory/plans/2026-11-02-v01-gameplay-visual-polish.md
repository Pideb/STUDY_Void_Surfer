# Plan: v0.1 gameplay / visual polish

> Status: superseded. 추가 인터뷰 A01~A13을 포함한 [v0.2 통합 계획](./2026-11-02-v02-feedback-release.md)으로 대체됐다. active pointer는 새 계획만 사용한다. 아래10Task는 당시 계획 이력이며 실제 구현 완료 기록이 아니다.

> 2026-11-02 추가 인터뷰 최신 결정: 사용자가2번을 선택해 이 작업의 다음 배포 목표를 **v0.2**로 변경했다. 과거 HTML 표시 v0.1/v0.1b, 과거 내부 식별자/보호 스냅샷은 보존한다. 아래 기존 v0.1 목표/다음 배포0.1 문구는 이전 이력이며 이 결정으로 대체한다. 추가 요구 설계가 끝나면 청사진을 함께 동기화한다. [추가 요청](../research/2026-11-02-v01-additional-menu-docs-records.md)

## Goal
확정된 v0.1 인터뷰와 실제 시안들을 본 게임에 일관되게 적용한다. 생성·판정·공격 수명을 먼저 안정화하고 시각·입력·성능을 검증한다. 구현 시안 승인과 본 게임 완료를 혼동하지 않으며, 현재 계획 단계에서는 구현 코드를 작성하지 않는다.

## Decisions
- [최종 확정 결정](../decisions/2026-11-02-v01-gameplay-visual-polish.md) — D43 최종 승인 포함.
- [인터뷰·조사 이력](../research/2026-10-30-v01-improvements-audit.md).
- v3: 초록 안내 그대로, 파괴 높이의 특수벽 자체 선만 제거. v2 초록 클립은 폐기.
- 실제 배포0.01-b 유지 / 목표 다음 배포0.1 / 현재 push·배포 권한 요청 아님.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | in_progress (planning complete, execution pending) | 하나의 게임 런타임과 UI·렌더를 단계별 구현/검증 | [P01](../phases/2026-11-02-v01-gameplay-visual-polish/P01-v01-runtime/phase.md) |

## Task sequence
1. T01 이동 구멍 정지·보스 벽 난이도·특수벽 판정
2. T02 WASD 오입력 피드백·시간·복귀 보호
3. T03 네 가지 시각 페널티·강한 글리치
4. T04 실제 발사 순간 기준 투사체 속도
5. T05 6지역 고유 공격·차수별 공격 해금
6. T06 승인 v3 아트·이동벽 선택·파괴 부분 선 제거
7. T07 모바일 조작·ArrowUp·대기 문구·현재 버전
8. T08 HUD·동일 프레임 레이어 재사용 최적화
9. T09 실게임 통합·경로·시각·성능 검증
10. T10 게임 관리 모델·개발 검토본·실행 기록 동기화

## Dependencies and boundaries
- T01→T02→T03→T04→T05→T06→T07→T08→T09→T10 순차 실행.
- 같은 앱과 엔진을 공유하므로 Phase는 하나. 각 Task는 자체 통과 가능한 검증·커밋 단위다.
- T04 탄속 helper를 T05 고유 공격이 사용한다. T03 가림 정책을 T08 캐시가 훼손하지 않는다.
- T06 디자인 승인과 T09 실제 경로/수명 검증을 구분한다. 시안 고정 스냅샷만으로 게임 적용 완료를 선언하지 않는다.
- 이전 계획의 done Task를 다시 열지 않고 이번 통합 계획만 active pointer로 관리한다.

## Validation strategy
- 각 Task의 지정 테스트 통과 후 해당 Task + phase/current 갱신과 한 개 커밋.
- T09 전체 Vitest / build / verify:config 및 실제 브라우저·성능·모바일 입력 검증.
- T10 문서 모델/개발 검토본 검증. 공식 docs:check는 실제 배포 소스 fingerprint가 바뀌므로 차단됨을 명시하고 배포 요청 때 release:prepare로 정식 갱신한다.
- 오류·필요 시 해당 범위 재검증. GPU 수치/에뮬레이션을 사용자 실기기 프레임 보장으로 확대하지 않는다.

## Version / deployment boundary
현재는 개발 실행 계획이며 배포는 포함하지 않는다. 공식 releases.json/보호된 발표 snapshot을 바꾸거나 docs:check를 우회하지 않는다. 개발용 관리·발표 검토본은 .memory 아래로만 생성한다. 후속 실제 배포 요청 시 AGENTS의 release:prepare --new-release → 검증/문서 → 커밋·push → 실제 Actions·HEAD·운영 bundle SHA 증거 → record-deployment를 따른다.

## Commit discipline
청사진의 Plan/Phase/Task 헤더를 사용한다. 기존 src/public 사용자 수정이 있으면 먼저 식별하며 무관한 변경을 섞지 않는다. 현재 연구/시안이 다수 untracked이므로 git add . 대신 명시 경로를 staging한다. 승인 자료는 참조 경로와 필요한 자산/해시를 함께 추적하되 대형 중복 HTML을 무분별하게 커밋하지 않는다. src/public이 없는 계획 단계에서는 구현 완료 커밋을 만들지 않는다.

## Progress
- decisions: confirmed
- planning: complete
- implementation: 0/10
- active: P01-T01

## Planning validation
- 2026-11-02: 결정/계획/Phase/current/Task 총14개 문서, Task10개 필수 청사진 항목과 커밋 헤더 확인.
- 로컬 문서 링크39개 해석 성공, 누락0.
- src/public/docs/scripts/package 변경 없음. 계획 단계이므로 게임 테스트·빌드·성능 재측정은 실행하지 않았다.

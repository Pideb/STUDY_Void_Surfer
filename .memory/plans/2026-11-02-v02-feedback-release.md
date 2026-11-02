# Plan: v0.2 feedback release

> 구현·로컬 검증·Task별 커밋 19/19 완료. [최종 검증](../validation/2026-11-02-v02-feedback-release/report.md). 운영 DB 적용·실제 로그인·실기기 확인은 배포 전 별도 gate이며 push·배포는 수행하지 않았다. 첫20벽/새스테이지도착후15벽, 보스·전환대기벽 제외. 동점은 해당 최고점수run의 긴 사망시간 우선이며 시간은 비공개다.

## Goal
기존 승인된 게임·시각 개선과 추가 피드백 기능을 하나의 순차 실행 계획으로 적용한다. 실제 게임·모바일·메뉴·비공개 기록·사용자/개발자 문서까지 검증하며 현재 운영0.01-b는 별도 배포 요청 전까지 유지한다.

## Decisions
- [최종 통합 결정](../decisions/2026-11-02-v02-feedback-release.md): 원래 게임 결정 + A01~A13 + 보스간격/랭킹D13·D14 확정.
- [기존 게임 세부 결정](../decisions/2026-11-02-v01-gameplay-visual-polish.md).
- [추가 인터뷰 이력](../research/2026-11-02-v01-additional-menu-docs-records.md).
- [승인 모바일 확대·회전 시안](../validation/2026-11-02-v02-mobile-menu-large/preview.html).
- 이전 [v0.1 계획](./2026-11-02-v01-gameplay-visual-polish.md)은 superseded. 기존 구현0/10이므로 기능을 버리거나 done을 취소한 것이 아니다.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | complete (12/12) | 게임·피드백 UI | [P01-game-experience](../phases/2026-11-02-v02-feedback-release/P01-game-experience/phase.md) |
| P02 | complete locally (3/3) | 비공개 플레이 기록 · 운영 적용 별도 | [P02-private-records](../phases/2026-11-02-v02-feedback-release/P02-private-records/phase.md) |
| P03 | complete (4/4) | 플레이어·관리 문서와 최종 검증 | [P03-docs-validation](../phases/2026-11-02-v02-feedback-release/P03-docs-validation/phase.md) |

## Task sequence
1. **T01** 이동 구멍 정지·보스 벽 난이도·특수벽 판정 ? P01-game-experience
2. **T02** WASD 오입력 피드백·시간·복귀 보호 ? P01-game-experience
3. **T03** 네 가지 시각 페널티·강한 글리치 ? P01-game-experience
4. **T04** 실제 발사 순간 기준 투사체 속도 ? P01-game-experience
5. **T05** 6지역 고유 공격·차수별 공격 해금 ? P01-game-experience
6. **T06** 승인 v3 아트·이동벽 선택·파괴 부분 선 제거 ? P01-game-experience
7. **T07** 모바일 조작·ArrowUp·대기 문구·현재 버전 ? P01-game-experience
8. **T08** HUD·동일 프레임 레이어 재사용 최적화 ? P01-game-experience
9. **T09** v0.2 버전·임시 해금·보스 순서와20/15벽 간격 ? P01-game-experience
10. **T10** 모든 메뉴 방향키·Space 탐색 ? P01-game-experience
11. **T11** 게임오버 재시작 입력·암전 안내·점수 저장 수명 ? P01-game-experience
12. **T12** PC 비율·모바일 확대·회전 중단과 수동 복귀 ? P01-game-experience
13. **T13** 개발자 전용 플레이 기록 DB·쓰기 RPC ? P02-private-records
14. **T14** 플레이시간·총횟수 측정·안정적인 기록 전송 ? P02-private-records
15. **T15** 동점 플레이시간 정렬·비공개 최고기록 시간 ? P02-private-records
16. **T16** 플레이어 가이드 HTML·수동 업데이트·메뉴 링크 ? P03-docs-validation
17. **T17** 관리 HTML 개발 예시 링크 탭 ? P03-docs-validation
18. **T18** 실게임 통합·경로·시각·성능 검증 ? P03-docs-validation
19. **T19** 게임 관리 모델·개발 검토본·실행 기록 동기화 ? P03-docs-validation

## Why these phases
런타임/메뉴와 서버 비공개 저장은 서로 다른 권한·검증 경계이며, 문서 생성/공개 자산/최종 검증은 그 결과를 묶는 별도 마일스톤이다. 작은 기능별로 Phase를 늘리지 않고 기존 게임8작업을 보존하여 전체19Task/3Phase로 구성했다.

## Dependencies and task boundaries
- T01부터T19까지 순서대로 각 청사진 구현→검증→커밋→phase/current 전진.
- T04탄속→T05고유공격, T03가림→T08캐시. T09공통해금/버전→T10메뉴탐색→T11빠른재시작→T12회전/배율.
- T13DB권한·멱등쓰기 계약을T14시계/전송이사용. T12회전reason이T14플레이시간제외를결정.
- 새T15가T14 frozen사망시간을사용해private 동점정렬/score원자갱신을구현. 통계송신완료와랭킹저장을분리한다.
- T16수동원고·공개가이드생성, T17로컬개발목록, T18전체실게임·권한·성능, T19공식모델과개발검토본.
- 같은 화면의기체변경/점수저장/통계전송수명을분리해빠른재시작으로이전응답이새run을덮지않게한다.

## Important regression guards
- 초록 성공안내를 지우지 않는다. 특수벽 파괴 높이의 자체 선만 제거.
- 임시 해금은 UI만이 아니라 엔진/늦은 계정 응답/게스트 출발 강제NOVA도 함께 처리.
- 회전은 일반pause()를재사용하지 않는다: -10/QTE무시 문제. setSuspended로모든시계동결→가로복귀계속하기.
- 플레이시간은QTE포함/준비·pause·회전제외,사망판정종료. 기존elapsed는그대로쓸수없다.
- 기록 SELECT를사용자에열지않고쓰기run증표를관리자키로오인하지않는다.
- public가이드출력은배포해시/currentVersion자기참조없게결정적으로생성하고fingerprint고정전에최신화. 수동업데이트원고자동작성금지.
- 개발예시탭은로컬전용. .memory 전체를public/dist로복사하지않는다.
- 보스는점수와무관한20/15벽,일반구간spawn슬롯도함께제한해실제벽수초과방지. stage도착완료전카운트금지.
- 랭킹시간을authenticated SELECT가능한player_scores에추가하지않는다. 별도private부가표/시간없는RPC응답,전체·주변동일정렬 유지.

## Version and document workflow
현재운영내부0.01-b,과거표시v0.1/v0.1b,다음실제배포v0.2. T09는표시alias·정책만변경하고currentVersion/배포증거/보호snapshot은보존한다. 다음기준0.3은자동승격하지않으며임시해금종료gate다.

개발중소스fingerprint가운영과달라공식 docs:check가차단되는것은정상적인배포전gate다. T19개발검토본은 .memory 아래로생성하고검사를위조하지않는다. 실제배포요청시 release:prepare --new-release(이때0.2준비)→전체검증·공식관리/발표/가이드출력·docs:check→커밋/push→실제Actions/HEAD/운영bundleSHA확인→record-deployment. 이번계획에는push/배포없음.

## Database validation boundary
이전 사용자 환경 제약에 따라 Docker를기동하지않는다. 새 migration/SQL시험/클라이언트는구현한다. 연결·권한이있으면원격개발자료로검증하고없으면배포전적용·역할별조회차단검증을별도gate로남긴다. 이를누락하거나이미운영반영됐다고쓰지않는다.

## Commit discipline
Task에 있는 Plan/Phase/Task 헤더 사용. 명시 경로만 staging하며 승인 시안·원본 backup·보호 snapshot을 보존했다. 개발 예시 탭에서 연결하는 선별 원본은 링크 동작을 위해 한 번씩 커밋했고 무관한 미사용 시안은 변경하지 않았다.

## Progress
- decisions: confirmed
- planning: complete
- implementation: 19/19 locally complete
- active: none
- deployment: not requested; no push/deployment

## Planning validation
- 2026-11-02 보완 후: 결정/계획/current/Phase3/Task19 총25개 문서 구조·필수 청사진 항목·커밋 헤더 확인.
- 로컬 링크75개,Task번호01~19 연속,기존경로 및 앞 Task 생성 예정 경로 일치. 오류0.
- git diff --check 통과. src/public/docs/scripts/supabase/AGENTS/package 변경 없음. 이번 턴은 계획 단계여서 게임 테스트·원격 DB·배포 검증은 실행하지 않았다.

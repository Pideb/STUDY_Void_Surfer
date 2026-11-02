# Task: T18 실게임 통합·경로·시각·성능 검증

> 이 작업은 [v0.2 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md)에 포함된다. 아래 기존 게임·시각 결정 링크는 원래 승인 세부를 보존한다. 버전·임시 해금·첫3보스·회전·메뉴·기록에 관한 충돌은 v0.2 통합 결정이 우선한다.

## Status: pending

## Goal
시안이 아닌 실제 엔진과 브라우저에서 전 기체·6지역·보스 차수 경계·모바일 입력·전체화면 렌더를 검증한다.

## Decision Summary
- 모든 기능은 T01~T17 결과를 대상으로 검사. 승인된 임시 해금 외 fixture 무적/강제 해금/가짜 물리로 회피 가능성을 증명하지 않는다. 계정/배포 검증을 조작 시뮬 결과와 구분한다.
- T17 완료·커밋 후 진행.
- [최종 결정](../../../decisions/2026-11-02-v01-gameplay-visual-polish.md). 범위 밖 물리·점수·계정·배포 변경 없음.
- world960×540 논리좌표, 실제화면의 CSS/물리픽셀과 구분. 프리뷰 fixture는 본게임 로직이 아니다.

## Implementation

### I01. 실게임 통합·경로·시각·성능 검증

- Related Files:
  - `tests/integration/v02-feedback-release.test.js` :: `end-to-end engine state transitions` — new
  - `tests/game/boss-unique-attacks.test.js` :: `deterministic path checks` — modify
  - `tests/integration/mobile-input.test.js` :: `real DOM input regression` — modify
  - `.memory/validation/2026-11-02-v02-feedback-release/report.md` :: `actual verification and limitations` — new
  - `.memory/validation/2026-11-02-v02-feedback-release/verification.json` :: `machine-readable checks and evidence` — new

#### Details
- **Signatures & Types** (JS 구현의 계약 명세이며 TypeScript 전환 요청 아님):
```typescript
type VerificationReport={schemaVersion:1;sourceHead:string;sourceHashes:Record<string,string>;tests:{command:string;exitCode:number}[];scenarios:ScenarioResult[];browser:{name:string;gpu:string;viewport:number[];renderBuffer:number[]};performance:Measurement[];limitations:string[]};
type ScenarioResult={stageId:string;aircraftId:string;bossNumber:number;seed:number;passed:boolean;evidence:string[]};
```
- **Data & Schema Fields**: report는 sourceHead+uncommitted file SHA 둘 다 기록. 실제 command/exitcode/캡처/환경을 남긴다. 실패가 있으면 전체 pass 금지. DB 원격 검증은 식별 가능한 테스트 run만 쓰고 일반 계정 점수를 임의 조작하지 않는다. 실기기/실로그인/원격권한 미실행은 limitation과 배포 전 gate로 구분한다.
- **Execution Flow / Logic**:
  1. 전 단위·통합·UI·오디오·계정·배포설정 테스트와 build/verify:config를 실행한다. 앞 작업별 통과 로그를 모으고 최종 소스 상태에서 전체 suite는 한 번 실행, 실패/새변경 때만 필요한 범위 반복.
  2. seed 고정 엔진 run:6지역, NOVA/AEGIS/VELOCITY, boss1/2/3/4/7, 최소·최대 실제속도, dt1/60·1/30·큰dt. first boss normalwalls, unique 미해금/해금, 세트clear/중첩, manual beamHP3/AEGIS3피해, QTEpause/recovery, 모든 공격 miss 후 다음블록 진행.
  3. 경로는 실제중력/클릭/히트박스로 확인한다. 얕은 fixedstep 충돌시뮬/입력탐색으로 예고 이후 유효 경로가 남는지 검토하고 가장 좁은 seed를 실제 브라우저로 재생한다. 유한 seed 통과를 모든 가능한 배치의 수학적 보장이라고 쓰지 않는다.
  4. 실브라우저에서6지역×5시각종류 및 파괴effect전수명/혼합/뒤로간벽/전환/준비후실플레이를 캡처한다. 초록안내 보존, PNG원본표시, 단일gap보호/전역wall0, boss위치에맞는총구 확인. window.artLab 등 fixture미사용.
  5. 모바일812×375/844×390,desktopFHD 및4K viewport→최대FHDbuffer를확인. 실pointer8키/잘못된키/동시fire+canvas/ArrowUp/blur를수행. 실제휴대폰하드웨어 미보유는 에뮬검증으로만 표기.
  6. 동일시나리오 performance 전후 p50/p95/p99·DOMwrites·버퍼·GPU 기록. 레이저 blur/해상도 불변 및 penalty+global 최악구간 pixel검증. 개선이 재현되지 않으면 그 사실을 보고하고 무근거FPS수치 만들지 않는다.
  7. 실계정기록쓰기 미검증은 기존대로남겨두고 guest/account/auth정책회귀만mock으로검증. 문제발견시해당청사진범위내수정후재검증; 승인모양/균형변경이필요할때만근거와새시안으로사용자에게돌아간다.
  8. 실제 UI에서 게스트/계정 임시3기체선택→출격→실제기체, 첫3보스순서, 늦은계정응답과빠른재시작 저장격리를 검증. 게임오버 ESC/그외새키/밖터치/랭킹포인터/held키 예외를 검사한다.
  9. PC6해상도 모든 메뉴·팝업과 모바일가로5크기 큰메뉴/세로2안내, QTE중회전→시간동결/감점0→가로후계속하기 전후를 확인. 준비중회전·늦은음악완료·취소·기존pause복원·총플레이시간 제외도 함께 검사한다.
  10. 서버 통계는 start1회/중복재시도/사망시간/QTE포함/pause회전제외/이탈미완료, 다른계정 전송차단과 anon/auth SELECT거절을 확인한다. 실제 원격 schema/role 검증 수단이 없으면 코드개발 검증과 운영 gate를 분리해 미완료를 명시한다.
  11. 실제 dist/guide/index.html 새탭·수동원고보존, 로컬관리archive링크와 public/dist 개발자산미포함, 과거표시alias/immutableSHA를 확인. 관리·발표·가이드 데이터에 비공개 로그가 들어가지 않아야 한다.
  12. 첫19벽/20벽·새스테이지14벽/15벽 경계, 보스/전환추가벽 제외,생성20/15상한·화면끝drain과score/보너스/pause독립성을검증. score기반강제bossfixture가실제진입조건을가리지않도록한다.
  13. 동점은같은사망run시간DESC,계정동점개선/낮은점수긴시간거절/시간동률보조정렬/미측정0·구형RPC·동시제출을검증. 전체/주변/고정자기순위가같고RPC/DOM/직접SELECT로시간이노출되지않아야한다. private랭킹migration원격gate도보고한다.
- **Error / state boundary**: 예외·재시작·무효입력 처리는 위 흐름대로 기존 게임을 멈추거나 다른 run 상태를 덮어쓰지 않아야 한다. 새 DB migration/외부 계정 설정 없음.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/integration/v02-feedback-release.test.js` :: `T18 behavioral coverage` — new
  - `tests/integration/play-record-lifecycle.test.js` :: `time and delivery regression` — modify
  - `supabase/tests/private_play_sessions.sql` :: `real role verification when remote access exists` — read-only
  - `tests/integration/ranking-duration.test.js` :: `private tiebreak integration` — modify
  - `supabase/tests/private_ranking_duration.sql` :: `private ordering/roles/concurrency when remote access exists` — read-only

#### Details
- 위 매트릭스와 실제 .memory evidence를 대응시킨다. 브라우저 검증은 도구 가용성을 먼저 확인하며 자동화로 얻을 수 없는 실기기/실로그인 결과를 추측하지 않는다. source7/18assets 및 original-baseline SHA 기준과 비교.
- 테스트는 구현 코드의 줄별 복제가 아니라 관찰 가능한 상태전이/입력/충돌/시각 결과를 검사한다.
- 미실행 항목은 limitation으로 기록한다. 승인되지 않은 새 디자인/밸런스가 필요하면 기존 승인을 확대 해석하지 말고 증거를 제시한다.

## Acceptance Criteria
- [ ] 전체 테스트·빌드·설정 검증이 통과하고 실제화면·입력·성능 증거가 남아 있다.
- [ ] 회피 경로·세트 종료·초록 안내·모바일 동작의 경계 사례 및 미검증 한계가 명시된다.
- [ ] 임시해금/키보드/게임오버/회전/통계/가이드/개발자료 비공개·원격검증 gate를 함께 보고한다.
- [ ] 지정 검증 통과와 증거/제약 기록, 무관한 소스·계정·배포 변경 없음.

## Validation
- `npm test -- --run` — 종료코드0 및 대상 검증 통과.
- `npm run build` — 종료코드0 및 대상 검증 통과.
- `npm run verify:config` — 종료코드0 및 대상 검증 통과.
- 실제 브라우저 시각·입력 검증 및 승인 시안 비교 결과를 `.memory/validation/2026-11-02-v02-feedback-release/`에 기록한다. 테스트 통과를 스크린샷 확인 대신 사용하지 않는다.

## Commit Message
```text
test(game): verify v0.2 gameplay menus private records and performance

Plan: 2026-11-02-v02-feedback-release
Phase: P03-docs-validation
Task: T18-integrated-release-validation

- 실게임 통합·경로·시각·성능 검증 적용 및 경계 사례 검증
- 승인 결정과 기존 게임 규칙 보존
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending

# Task: T12 PC 비율·모바일 확대·회전 중단과 수동 복귀

## Status: done

## Goal
승인한PC비율/큰모바일메뉴/세로안내를적용하고회전중모든게임시계를감점없이멈춘뒤계속하기로안전하게복귀한다.

## Decision Summary
- D09~D11. PC1600×900fit;mobilemain20px/60px,작은19px/56px,보조52~56. 게임대시64/QTE56은보존. orientation중단별도이며manualpause감점그대로.
- [최종 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md).
- 선행 T11 게임오버 재시작 입력·암전 안내·점수 저장 수명 완료·커밋 후 진행. 현재 작업은 자기 범위만 검증하며 실제 배포는 수행하지 않는다.
- DB·통신·브라우저 실패를 게임 자체 실패나 미검증 성공으로 바꾸지 않는다.

## Implementation

### I01. PC 비율·모바일 확대·회전 중단과 수동 복귀

- Related Files:
  - `src/ui/menu-layout.js` :: `createMenuLayout / layout mode` — new
  - `src/ui/orientation-controller.js` :: `createOrientationController` — new
  - `src/ui/app-controller.js` :: `paint / pendingStart / activatePreparedStart / loop / input / overlay lifecycle` — modify
  - `src/game/game-engine.js` :: `setSuspended / update / beginPreparedRun / input guard / getSnapshot` — modify
  - `src/ui/screens.js` :: `renderOrientationScreen / renderRotationResumeScreen` — modify
  - `src/styles.css` :: `approved reference menu / mobile layout / gate / transformed UI bounds` — modify
  - `src/audio/audio-manager.js` :: `existing pause/resume music integration` — read-only

#### Details
- **Signatures & Types** (실제 구현은 기존 JS, 다음은 계약):
```typescript
type SuspensionReason='orientation';
setSuspended(reason:SuspensionReason,active:boolean):void;
type OrientationState={mobile:boolean;portrait:boolean;resumePending:boolean;priorScreen:string|null};
createOrientationController(options:{onChange:(state:OrientationState)=>void;isMobile?:()=>boolean}):{getState():OrientationState;confirmResume():void;destroy():void};
createMenuLayout(root:HTMLElement):{refresh():void;destroy():void};
```
- **Data & Schema Fields**: engine.suspensionReasons:Set<string> 초기empty, 회전 전 screen/playing/challenge 상태 보존. screen을 PAUSED로 위장하지 않는다. snapshot.suspensionReasons:string[]은 복사본. reference1600×900. 모바일 판정은 UAData.mobile/기존 모바일 UA와 touch+coarse 보조, 단순 PC 창 너비만으로 판정하지 않는다.
- **Execution Flow / Logic**:
  1. PC 메뉴/팝업 전용 design wrapper를 min(w/1600,h/900) 배율로 일괄 조절한다. 기존 메뉴 CSS의 vw/vh를 기준 값으로 통일해 요소별 다른 배율을 막는다. HUD/canvas는 밖에 두고 랭킹 scroll/dialog 초점/화면 경계를 검증한다. 프로덕션에서는 필요한 메뉴 규칙만 정리하며 원본 CSS 전체를 매 프레임 복제하지 않는다.
  2. 모바일 가로는 승인된 확대 배치를 사용한다. 왼쪽 브랜드·기체·계정/오른쪽 메뉴, 주20px·60px/작은19px·56px, 보조16px·52~56px. 기체 intrinsic 높이로 행이 커지지 않게 명시 높이와 minmax(0,1fr)를 사용한다. 높이360px 이하 인사말 생략은 승인 시안의 조건이다.
  3. 모바일portrait면최상위승인회전안내+아래UIinert. setSuspended('orientation',true)는score/state진행을바꾸지않고update가lastUpdateMs를현재로맞춘뒤earlyreturn. QTE/모션/무기충전/레이저예고/페널티/대시쿨타임/스폰·death연출을모두동결;물리dt누적catchup금지.
  4. 세로전환전실플레이였으면가로복귀후에도suspended유지하고'계속하기'overlay를표시. 새pointer/Space로계속하기를확인한후에만suspension해제/오디오/RAF/입력재개. 이미manualpaused였다면기존paused화면유지·추가감점0. 메뉴/결과는원화면복원만.
  5. 준비중portrait면 pendingStart를즉시출격시키지않고readiness/fallback완료를pending으로보관. 돌아오면원래준비흐름에서활성화,취소/stale request는유효성검사. 아직시작하지않은run에telemetry시작이벤트나시간을만들지않는다.
  6. 회전시음악pause/resume중복방지,held입력정리,resize/safearea/가로세로반복/라우트변경에도overlay중복없이복구. orientationchange만의존하지말고visualViewport/windowresize의실제높이사용. 화면방향OSlock보장금지.
  7. T14통계가읽을수있도록실제시작/사망/suspension경계의명시state또는event제공. normalpause -10·QTEpause거부기존계약은변경하지않는다. runstop/unmount는suspension과리스너모두정리.
- **Error & State Boundary**: 위 절차의 유효성 검사/멱등성/생명주기·실패 처리를 구현한다. 오류를 무시하고 성공 상태를 쓰거나 새 run/다른 계정에 완료 응답을 적용하지 않는다.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/ui/menu-layout.test.js` :: `T12 behavioral coverage` — new
  - `tests/ui/orientation-controller.test.js` :: `T12 behavioral coverage` — new
  - `tests/ui/app-controller.test.js` :: `T12 behavioral coverage` — modify
  - `tests/game/game-engine.test.js` :: `T12 behavioral coverage` — modify
  - `tests/ui/preparing-start.test.js` :: `T12 behavioral coverage` — modify
  - `tests/integration/mobile-input.test.js` :: `T12 behavioral coverage` — modify

#### Details
- PC6해상도메뉴정규화동일·hangar/tutorial/gameover/rank/admin포커스,가로5기기모든target52+,portrait2/PC세로예외. QTE중세로30s후remaining불변/감점0/가로후continue전동결/continue후catchup0. 기존pause/준비늦은완료/취소/로그아웃/죽음/반복회전/오디오정합.
- UI/상태/권한의 실제 관찰 결과를 검증한다. 정적 SQL 문자열 검사와 실제 DB 역할별 동작 확인은 구분한다.
- 네트워크/원격 자원 접근이 없으면 미실행 사실·정확한 후속 명령·예상 결과를 기록하며 운영 완료로 보고하지 않는다.

## Acceptance Criteria
- [x] PC·모바일메뉴·세로안내가승인시안과맞고터치/키보드로사용가능하다.
- [x] 회전중게임·QTE·플레이시간이감점없이멈추며가로후계속하기로만재개한다.
- [x] 지정 검증 및 관련 한계 기록. 무관한 버전 승격/push/배포 없음.

## Validation
- `npm test -- --run tests/ui/menu-layout.test.js tests/ui/orientation-controller.test.js tests/ui/app-controller.test.js tests/game/game-engine.test.js tests/ui/preparing-start.test.js tests/integration/mobile-input.test.js` — 종료0.
- `npm run build` — 종료0.

- 실제 브라우저/승인 시안 비교 결과를 `.memory/validation/2026-11-02-v02-feedback-release/`에 기록한다.

## Commit Message
```text
feat(ui): scale menus and suspend gameplay for mobile rotation

Plan: 2026-11-02-v02-feedback-release
Phase: P01-game-experience
Task: T12-responsive-menu-and-orientation-suspension

- PC 비율·모바일 확대·회전 중단과 수동 복귀 구현 및 경계 검증
- 승인된 기존 규칙과 운영 기록 보존
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: see Git log (Task header)

## Execution evidence
- Vitest6 files/132 tests passed. Real browser normalized menus at6 PC resolutions;5 mobile landscapes all menu targets>=52px; portrait gate and manual resume verified,0 exceptions. QTE30s freeze/no penalty/no catchup and ready-audio deferral covered. Build passed; original hero subtree stays connected across repaints.

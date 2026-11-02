# Task: T10 모든 메뉴 방향키·Space 탐색

## Status: pending

## Goal
기존 hover와 같은 키보드 강조로 메뉴와 대화상자를 조작하며 게임 키/브라우저 입력 충돌을 막는다.

## Decision Summary
- D03/D04/D11. 게임오버는 ESC메인/그외재시작 예외이며 방향키탐색 대상에서 제외. 회전 안내는 최상위 입력 소유자.
- [최종 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md).
- 선행 T09 v0.2 버전 표기·임시 기체 해금·초반 보스 순서 완료·커밋 후 진행. 현재 작업은 자기 범위만 검증하며 실제 배포는 수행하지 않는다.
- DB·통신·브라우저 실패를 게임 자체 실패나 미검증 성공으로 바꾸지 않는다.

## Implementation

### I01. 모든 메뉴 방향키·Space 탐색

- Related Files:
  - `src/ui/menu-navigation.js` :: `createMenuNavigation` — new
  - `src/ui/app-controller.js` :: `handleKeyDown / paint / replaceMenuKeepingPreview / unmount` — modify
  - `src/ui/components.js` :: `focus and action semantics` — modify
  - `src/ui/screens.js` :: `menu/hangar/tutorial/paused/ranking/admin item identifiers` — modify
  - `src/styles.css` :: `hover and keyboard-current shared selectors` — modify

#### Details
- **Signatures & Types** (실제 구현은 기존 JS, 다음은 계약):
```typescript
createMenuNavigation(root:HTMLElement,options?:{activate:(element:HTMLElement)=>void}):{refresh():void;handleKey(event:KeyboardEvent):boolean;reset():void;destroy():void};
type MenuFocus={screenKey:string;activeItemId:string|null;lastInput:'keyboard'|'pointer'};
```
- **Data & Schema Fields**: activeItemId 초기null, screenKey는 화면 전환 때 갱신. data-menu-item-id로 재paint 동일 항목 유지. 키 상태는 keyup/blur에서 해제. 영구 저장 없음. 기존 aria-pressed는 기체 선택 상태이며 초점 강조와 구분한다.
- **Execution Flow / Logic**:
  1. 현재 visible top dialog 또는 active screen 내부의 enabled button/a/input만 탐색. hidden/inert/disabled 제외. 세로 목록은상하, grid기체는 실제행열과좌우에맞춰이웃으로; 없으면 같은축 끝으로순환하는 일관 규칙.
  2. Space는keydown1회 activate,keyup native click를중복실행하지않게한다. anchor는 .click()로 실제사용자gesture를유지하여가이드새탭허용. 기존Tab/Enter/체크박스 키보드기능을유지하고입력창 문자를가로채지않는다.
  3. 초기화면 선택은 첫 enabled 항목. 같은화면 재paint시 stable id로보존,제거되면가까운유효항목복구. 마우스 이동/hover와 충돌하지않게 input모드만바꾸며 영구적인 selected craft표시와구분한다.
  4. CSS hover선택자와 .is-keyboard-current에동일color/background/border/shadow. 잠긴항목/음량icon/텍스트link에는각기존hover를사용,새디자인추가없음.
  5. gameover/gameplay/QTE/회전게이트 우선처리 후 일반메뉴handler로분기. admin모달focus trap,랭킹표scroll과하단고정메뉴의arrow를분리하여방향키가모든페이지스크롤을막지않게한다.
  6. paint/메뉴구조보존함수에서리스너중복없게관리. blur/unmount/newscreen에서latch/관찰자해제,stale노드를activate하지않는다.
- **Error & State Boundary**: 위 절차의 유효성 검사/멱등성/생명주기·실패 처리를 구현한다. 오류를 무시하고 성공 상태를 쓰거나 새 run/다른 계정에 완료 응답을 적용하지 않는다.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/ui/menu-navigation.test.js` :: `T10 behavioral coverage` — new
  - `tests/ui/app-controller.test.js` :: `T10 behavioral coverage` — modify
  - `tests/ui/screens.test.js` :: `T10 behavioral coverage` — modify
  - `tests/ui/accessibility.test.js` :: `T10 behavioral coverage` — modify
  - `tests/integration/mobile-input.test.js` :: `T10 behavioral coverage` — modify

#### Details
- 모든메뉴상하좌우/기체grid/잠금skip/로딩재paint/행없음/모달탭trap/Space1회/keyup합성중복0/blur. oldhover스타일동일성,실브라우저방향키가이드Space새탭. 게임over·WASD는탐색무시.
- UI/상태/권한의 실제 관찰 결과를 검증한다. 정적 SQL 문자열 검사와 실제 DB 역할별 동작 확인은 구분한다.
- 네트워크/원격 자원 접근이 없으면 미실행 사실·정확한 후속 명령·예상 결과를 기록하며 운영 완료로 보고하지 않는다.

## Acceptance Criteria
- [ ] 모든일반메뉴를방향키·Space로조작하고마우스hover와동일한강조가보인다.
- [ ] 게임입력·모달·입력창·게임오버예외가충돌하지않는다.
- [ ] 지정 검증 및 관련 한계 기록. 무관한 버전 승격/push/배포 없음.

## Validation
- `npm test -- --run tests/ui/menu-navigation.test.js tests/ui/app-controller.test.js tests/ui/screens.test.js tests/ui/accessibility.test.js tests/integration/mobile-input.test.js` — 종료0.

- 실제 브라우저/승인 시안 비교 결과를 `.memory/validation/2026-11-02-v02-feedback-release/`에 기록한다.

## Commit Message
```text
feat(ui): enable directional keyboard menu navigation

Plan: 2026-11-02-v02-feedback-release
Phase: P01-game-experience
Task: T10-keyboard-menu-navigation

- 모든 메뉴 방향키·Space 탐색 구현 및 경계 검증
- 승인된 기존 규칙과 운영 기록 보존
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending

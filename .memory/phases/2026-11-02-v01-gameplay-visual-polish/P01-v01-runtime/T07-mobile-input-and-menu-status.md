# Task: T07 모바일 조작·ArrowUp·대기 문구·현재 버전

## Status: pending

## Goal
가로 모바일에서겹치지않는터치조작을제공하고위방향키상승·간결한출격대기·실제현재버전을표시한다.

## Decision Summary
- 최종결정§10.64CSSpx대시오른쪽/발사왼쪽;WASD아래56px/12gap;canvas상승.버전canonicalregistry0.01-b유지.계정/게스트정책변경없음.
- T06 완료·커밋 후 진행.
- [최종 결정](../../../decisions/2026-11-02-v01-gameplay-visual-polish.md). 범위 밖 물리·점수·계정·배포 변경 없음.
- world960×540 논리좌표, 실제화면의 CSS/물리픽셀과 구분. 프리뷰 fixture는 본게임 로직이 아니다.

## Implementation

### I01. 모바일 조작·ArrowUp·대기 문구·현재 버전

- Related Files:
  - `src/ui/game-hud.js` :: `existing mobile actions and WASD touch buttons` — modify
  - `src/ui/app-controller.js` :: `keyboard handlers / triggerLift / challenge input / blur reset` — modify
  - `src/ui/screens.js` :: `renderPreparingScreen / renderMenuScreen / renderTutorialScreen` — modify
  - `src/styles.css` :: `landscape touch controls / safe-area / version label` — modify
  - `docs/management/releases.json` :: `currentVersion` — read-only
  - `.memory/validation/2026-11-02-v01-mobile-controls/selected-settings.json` :: `approved mobile layout` — read-only

#### Details
- **Signatures & Types** (JS 구현의 계약 명세이며 TypeScript 전환 요청 아님):
```typescript
type InputLatch={arrowUpDown:boolean};
renderMenuScreen(model:ExistingMenuModel,handlers:ExistingMenuHandlers):HTMLElement; // preserve existing two-argument API
triggerLift():void;
submitChallengeKey(key:'W'|'A'|'S'|'D'):void;
```
- **Data & Schema Fields**: arrowUpDown=false, keyup/blur/reset에서 false로 초기화한다. version은 canonical JSON의 currentVersion 문자열을 import하며 package version과 이중 관리하지 않는다. 기존 button dataset action을 재사용한다. CSS64/56은 물리 픽셀/논리 월드px가 아닌 CSSpx다.
- **Execution Flow / Logic**:
  1. 기존 canvas pointerdown 상승과 action 버튼을 재사용한다. 버튼 pointerdown은 적절히 전파를 막고 synthetic click 중복/멀티터치를 관리한다. 밖으로 이동/pointerup/cancel 이후 눌림 상태가 남지 않게 한다.
  2. ArrowUp 단발 keydown에서 triggerLift, repeat/held guard로 연속 발동 방지, keyup/blur/run reset으로 해제한다. WASD 중 ArrowUp은 상승시키지 않는다. 입력창/게임 밖은 기존 키보드 대상 조건에 따르며 페이지 scroll 억제만 남기지 않는다.
  3. 모바일 가로 action bar는 오른쪽 아래, fire 왼쪽/dash 오른쪽 각각64. WASD 아래 한 줄/각56/gap12. env(safe-area-inset-*)와 높이375/작은 폭을 고려한다. pause/sound48target, score/weapon/QTE와 겹치지 않게 하고 desktop의 touch 비표시는 유지한다.
  4. renderPreparingScreen 가시 내용은 '출격 준비 중'만. 본문/메뉴 버튼은 제거하며 ARIA/live도 일치시킨다. Escape 취소/10초 음악 fallback/늦게 같은 곡 재생/stale async run 격리를 유지한다.
  5. 메인 왼쪽 아래 small version은 release JSON currentVersion 사용. 개발 중0.1 하드코딩 금지, 다음 release:prepare에서 자동 연동. 튜토리얼은 ArrowUp 같은 상승 안내만 갱신하고 출격 대기와 혼동하지 않는다.
  6. 기존 focus/disabled/aria-button-label 보존. hidden/회전/resize 후 위치와 입력 latch를 정리한다. 프리뷰0gravity/가짜 무기 충전 fixture 복사 금지.
- **Error / state boundary**: 예외·재시작·무효입력 처리는 위 흐름대로 기존 게임을 멈추거나 다른 run 상태를 덮어쓰지 않아야 한다. 새 DB migration/외부 계정 설정 없음.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/integration/mobile-input.test.js` :: `T07 behavioral coverage` — modify
  - `tests/ui/app-controller.test.js` :: `T07 behavioral coverage` — modify
  - `tests/ui/screens.test.js` :: `T07 behavioral coverage` — modify
  - `tests/ui/preparing-start.test.js` :: `T07 behavioral coverage` — modify
  - `tests/integration/prepared-run.test.js` :: `T07 behavioral coverage` — modify
  - `tests/audio/gameplay-preparation.test.js` :: `T07 behavioral coverage` — modify
  - `tests/ui/accessibility.test.js` :: `T07 behavioral coverage` — modify

#### Details
- 실pointer로멀티터치fire/dash→lift중복0,8key row입력/오타flash,챌린지행동차단. ArrowUp반복/키업/blur/회복lift.812×375/844×390/960×540과safearea별CSSbounds. preparing본문제거/취소/10s/취소후latepromise새run안시작. 버전0.01-b는registry와일치.
- 테스트는 구현 코드의 줄별 복제가 아니라 관찰 가능한 상태전이/입력/충돌/시각 결과를 검사한다.
- 미실행 항목은 limitation으로 기록한다. 승인되지 않은 새 디자인/밸런스가 필요하면 기존 승인을 확대 해석하지 말고 증거를 제시한다.

## Acceptance Criteria
- [ ] 375px높이가로모바일에서확정크기·배치가겹치지않고버튼중복상승없음.
- [ ] ArrowUp상승과준비문구/현재버전표시가정확하다.
- [ ] 지정 검증 통과와 증거/제약 기록, 무관한 소스·계정·배포 변경 없음.

## Validation
- `npm test -- --run tests/integration/mobile-input.test.js tests/ui/app-controller.test.js tests/ui/screens.test.js tests/ui/preparing-start.test.js tests/integration/prepared-run.test.js tests/audio/gameplay-preparation.test.js tests/ui/accessibility.test.js` — 종료코드0 및 대상 검증 통과.
- 실제 브라우저 시각·입력 검증 및 승인 시안 비교 결과를 `.memory/validation/2026-11-02-v01-gameplay-visual-polish/`에 기록한다. 테스트 통과를 스크린샷 확인 대신 사용하지 않는다.

## Commit Message
```text
feat(ui): refine mobile controls and departure status

Plan: 2026-11-02-v01-gameplay-visual-polish
Phase: P01-v01-runtime
Task: T07-mobile-input-and-menu-status

- 모바일 조작·ArrowUp·대기 문구·현재 버전 적용 및 경계 사례 검증
- 승인 결정과 기존 게임 규칙 보존
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending

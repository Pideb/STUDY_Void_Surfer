# Task: T03 네 가지 시각 페널티·강한 글리치

> 이 작업은 [v0.2 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md)에 포함된다. 아래 기존 게임·시각 결정 링크는 원래 승인 세부를 보존한다. 버전·임시 해금·첫3보스·회전·메뉴·기록에 관한 충돌은 v0.2 통합 결정이 우선한다.

## Status: done

## Goal
승인한 먹물/글리치/균열/안개가 동일 확률로8초 적용되고 최종 화면에서 실제로 시야를 방해한다.

## Decision Summary
- 최종결정§4. 강한 글리치.18초, player주변도 동일. 새 물리/점수 페널티 없음. 승인editor형태와JSON을 같이 이식한다.
- T02 완료·커밋 후 진행.
- [최종 결정](../../../decisions/2026-11-02-v01-gameplay-visual-polish.md). 범위 밖 물리·점수·계정·배포 변경 없음.
- world960×540 논리좌표, 실제화면의 CSS/물리픽셀과 구분. 프리뷰 fixture는 본게임 로직이 아니다.

## Implementation

### I01. 네 가지 시각 페널티·강한 글리치

- Related Files:
  - `src/game/wasd-challenge.js` :: `failure effect selection` — modify
  - `src/game/challenge-effects.js` :: `drawChallengeFailure / noise cache` — modify
  - `src/game/renderer.js` :: `failure effect compositing / enemy redraw` — modify
  - `.memory/validation/2026-10-30-v01-glitch-preview/editor.js` :: `drawEditorCrack / drawEditorFog / editorPalette` — read-only
  - `.memory/validation/2026-10-30-v01-glitch-preview/selected-settings.json` :: `confirmed crack and fog values` — read-only

#### Details
- **Signatures & Types** (JS 구현의 계약 명세이며 TypeScript 전환 요청 아님):
```typescript
type FailureKind = 'ink'|'glitch'|'crack'|'fog';
type FailureEffect = {kind:FailureKind;remainingSeconds:number;durationSeconds:number;seed:number};
drawChallengeFailure(ctx:CanvasRenderingContext2D,effect:FailureEffect,player:Player,options?:{reducedMotion?:boolean}):void;
```
- **Data & Schema Fields**: durationSeconds=8, seed는효과당한번. crack web/steel/.7/1.12/19/3.7/.5/1.05/74/48; fog clouds/steel/.9/210/12/60/85. glitch burst start[.9,2.1,3.15,4.55,5.7,6.9], duration.18. 배열/seed기반geometry캐시효과수명종료시해제. 기존잉크필드호환.
- **Execution Flow / Logic**:
  1. 기존 rng를 써 네kind 25% 구간으로 선택. activeEffect=fog/sceneTheme=abyss는 편집기 상태이므로 지역/확률에 적용하지 않는다.
  2. editor palette/균열web형태/구름분포와 시간애니메이션을 승인 함수에서 이식한다. JSON숫자를 임의의 다른디자인에 대입하지 않는다. 동일 seed/time에서 결정적으로 그린다.
  3. elapsed=duration-remaining으로 strongburst여부 계산. burst사이는약한noise, strong에서는player/적공격까지가림. 기존even-odd playerellipseclip은먹물에만적용. 기본텍스처240×135/22Hz 등효율적인캐시재사용가능.
  4. renderer의 failure후 적재그리기 순서를 조정하여 가림취소방지. 보호해야할필수HUD/도전 UI는 유지; 반대로 보스공격을무조건최상단재노출하지않는다.
  5. 각ctx.save/restore,globalAlpha/filter/composite를복원. 동영상 미리보기나측정hook을src에복사하지 않는다. 효과수명/재시작/resize시캐시정리, invalidkind는안전하게drawskip.
  6. 광과노이즈를 무작정전체화면강한점멸로바꾸지않고확정 타임라인 유지. reducedMotion일때원래접근성경로를보존하고강제신규정책은추가하지않는다.
- **Error / state boundary**: 예외·재시작·무효입력 처리는 위 흐름대로 기존 게임을 멈추거나 다른 run 상태를 덮어쓰지 않아야 한다. 새 DB migration/외부 계정 설정 없음.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/game/challenge-effects.test.js` :: `T03 behavioral coverage` — modify
  - `tests/game/wasd-challenge.test.js` :: `T03 behavioral coverage` — modify
  - `tests/game/renderer.test.js` :: `T03 behavioral coverage` — modify

#### Details
- rng경계4종/8초만료, .18burst 전후시간, player영역clip차이, 고정seed/time별캡처. 최종 framebuffer에서공격이복구되지않음. ctx상태복원/다음run캐시정리/375높이확인. 통계비율은경계테스트로하고무작위flaky시험금지.
- 테스트는 구현 코드의 줄별 복제가 아니라 관찰 가능한 상태전이/입력/충돌/시각 결과를 검사한다.
- 미실행 항목은 limitation으로 기록한다. 승인되지 않은 새 디자인/밸런스가 필요하면 기존 승인을 확대 해석하지 말고 증거를 제시한다.

## Acceptance Criteria
- [x] 승인한4종이각25% 후보이며8초후제거된다.
- [x] .18초강한글리치가player주변/적공격위에실제로합성된다.
- [x] 지정 검증 통과와 증거/제약 기록, 무관한 소스·계정·배포 변경 없음.

## Validation
- `npm test -- --run tests/game/challenge-effects.test.js tests/game/wasd-challenge.test.js tests/game/renderer.test.js` — 종료코드0 및 대상 검증 통과.

## Commit Message
```text
feat(effects): add approved vision penalties and glitch bursts

Plan: 2026-11-02-v02-feedback-release
Phase: P01-game-experience
Task: T03-vision-penalty-effects

- 네 가지 시각 페널티·강한 글리치 적용 및 경계 사례 검증
- 승인 결정과 기존 게임 규칙 보존
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: see Git log (Task header)

## Execution evidence
- Vitest: 3 files / 55 tests passed. Four RNG boundaries, .18s burst boundaries, ink-only player clip verified. Full framebuffer and small-screen capture deferred to integrated validation.

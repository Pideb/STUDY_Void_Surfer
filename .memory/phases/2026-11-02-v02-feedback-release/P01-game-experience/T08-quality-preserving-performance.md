# Task: T08 HUD·동일 프레임 레이어 재사용 최적화

> 이 작업은 [v0.2 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md)에 포함된다. 아래 기존 게임·시각 결정 링크는 원래 승인 세부를 보존한다. 버전·임시 해금·첫3보스·회전·메뉴·기록에 관한 충돌은 v0.2 통합 결정이 우선한다.

## Status: pending

## Goal
화질과효과를낮추지않고불필요한HUD DOM갱신과적레이어중복렌더를줄이며같은조건의전후비용을기록한다.

## Decision Summary
- D25/D26,최종결정§11. blur감소미채택,FHDcap/밀도/nativeRAF/기체보스품질유지. 성능백업원본덮어쓰기없음.
- T07 완료·커밋 후 진행.
- [최종 결정](../../../decisions/2026-11-02-v01-gameplay-visual-polish.md). 범위 밖 물리·점수·계정·배포 변경 없음.
- world960×540 논리좌표, 실제화면의 CSS/물리픽셀과 구분. 프리뷰 fixture는 본게임 로직이 아니다.

## Implementation

### I01. HUD·동일 프레임 레이어 재사용 최적화

- Related Files:
  - `src/ui/game-hud.js` :: `update / challenge key node creation / button state` — modify
  - `src/game/render-layers.js` :: `paint / per-frame layer reuse` — modify
  - `src/game/renderer.js` :: `drawEnemy / final compositing / player beam` — modify
  - `src/game/render-resolution.js` :: `unchanged render budget reference` — read-only
  - `.memory/validation/2026-10-30-v01-performance/original-baseline/` :: `5 original files and manifest` — read-only
  - `.memory/validation/2026-10-30-v01-performance/hud-cached.mjs` :: `measurement and reference only` — read-only

#### Details
- **Signatures & Types** (JS 구현의 계약 명세이며 TypeScript 전환 요청 아님):
```typescript
type HudRenderCache={score:string|null;challengeSequenceKey:string|null;challengeCursor:number|null;wrongKeyEventId:number|null;disabledKey:string|null;weaponKey:string|null};
type LayerFrameCache={frameId:number;enemyLayers:Map<string,CanvasImageSource>};
beginFrame(frameId:number):void; // new layer lifecycle contract, renderer-owned
```
- **Data & Schema Fields**: HUDcache초기null/노드생성시만배열교체,render관련모든field포함. frameId는 매 draw 증가, snapshot identity만재사용키로쓰지않음. 전용enemybuffer는현프레임유효,resize/contextloss/newrun에invalidate. cache보관최대레이어수고정.
- **Execution Flow / Logic**:
  1. HUDtext/attribute/style은값변할때만쓴다. WASDsequence가같으면노드재사용,current/정답/오류event/disabled/remaining표시만변경. 이벤트리스너중복등록금지/기존모바일입력유지.
  2. 같은프레임의동일적draw결과만재사용. 플레이어beam이laserslayer를clear하는공유경로를분리하거나dedicatedenemybuffer확보. 다른snapshot/다른frame까지무조건재사용금지.
  3. T03최종가림정책보존:강한penalty위에적공격을캐시든재draw든복원금지. 필요한일반최종합성은동일캐시사용하여중복raster를줄인다. guide/beam/shipz순서변경없음.
  4. 1920×1080/FHDmax/nativeRAF와layerdensities.5/.75/.5/.35 고정. blur/particles/art/ship/boss해상도감소안도입금지. qualityoriginal백업은새기능이식전롤백파일로통째덮어쓰지않는다.
  5. 동일GPU/browser/viewport/buffer/seed/run시나리오에서before와after p50/p95/p99/frameDOMwrites/메모리측정. 실패+전역laser별최악비용도보고. headless수치를실사용FPS보장으로설명하지않는다.
  6. cache실패/context미지원시기존drawfallback,visualpixel정합유지. layer크기/반복run으로메모리무한증가없음.
- **Error / state boundary**: 예외·재시작·무효입력 처리는 위 흐름대로 기존 게임을 멈추거나 다른 run 상태를 덮어쓰지 않아야 한다. 새 DB migration/외부 계정 설정 없음.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/ui/game-hud.test.js` :: `T08 behavioral coverage` — modify
  - `tests/game/render-layers.test.js` :: `T08 behavioral coverage` — modify
  - `tests/game/render-resolution.test.js` :: `T08 behavioral coverage` — modify
  - `tests/game/renderer.test.js` :: `T08 behavioral coverage` — modify
  - `tests/integration/mobile-input.test.js` :: `T08 behavioral coverage` — modify

#### Details
- 동일snapshot연속HUD DOMmutation0에가까운변경필드만,오타flash/시간바/UI비활성누락없음. enemy동일frame1raster,다음frame갱신,playerbeam독립,resize실효. 같은seed/time픽셀비교와FHD실렌더비용측정report. 원본5fileSHA보존확인.
- 테스트는 구현 코드의 줄별 복제가 아니라 관찰 가능한 상태전이/입력/충돌/시각 결과를 검사한다.
- 미실행 항목은 limitation으로 기록한다. 승인되지 않은 새 디자인/밸런스가 필요하면 기존 승인을 확대 해석하지 말고 증거를 제시한다.

## Acceptance Criteria
- [ ] 화질·레이저blur를유지하면서중복DOM/raster작업이줄어든증거가있다.
- [ ] 페널티가림·플레이어빔·resize에서캐시잔상이나레이어덮어쓰기없음.
- [ ] 지정 검증 통과와 증거/제약 기록, 무관한 소스·계정·배포 변경 없음.

## Validation
- `npm test -- --run tests/ui/game-hud.test.js tests/game/render-layers.test.js tests/game/render-resolution.test.js tests/game/renderer.test.js tests/integration/mobile-input.test.js` — 종료코드0 및 대상 검증 통과.
- 실제 브라우저 시각·입력 검증 및 승인 시안 비교 결과를 `.memory/validation/2026-11-02-v01-gameplay-visual-polish/`에 기록한다. 테스트 통과를 스크린샷 확인 대신 사용하지 않는다.

## Commit Message
```text
perf(render): reuse HUD state and same-frame enemy layers

Plan: 2026-11-02-v02-feedback-release
Phase: P01-game-experience
Task: T08-quality-preserving-performance

- HUD·동일 프레임 레이어 재사용 최적화 적용 및 경계 사례 검증
- 승인 결정과 기존 게임 규칙 보존
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending

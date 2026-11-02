# Task: T06 승인 v3 아트·이동벽 선택·파괴 부분 선 제거

> 이 작업은 [v0.2 통합 결정](../../../decisions/2026-11-02-v02-feedback-release.md)에 포함된다. 아래 기존 게임·시각 결정 링크는 원래 승인 세부를 보존한다. 버전·임시 해금·첫3보스·회전·메뉴·기록에 관한 충돌은 v0.2 통합 결정이 우선한다.

## Status: pending

## Goal
심연B/나머지A 이동벽과 그림중심 투사체·단일 레이저, 지역색 전역 레이저를 적용하고 초록 안내를 그대로 유지한다.

## Decision Summary
- 최종결정§8~9. v3최종승인. 벽전체PNG복원/초록guide클립/전역레이저PNG교체는폐기. 충돌/성공box는불변.
- T05 완료·커밋 후 진행.
- [최종 결정](../../../decisions/2026-11-02-v01-gameplay-visual-polish.md). 범위 밖 물리·점수·계정·배포 변경 없음.
- world960×540 논리좌표, 실제화면의 CSS/물리픽셀과 구분. 프리뷰 fixture는 본게임 로직이 아니다.

## Implementation

### I01. 승인 v3 아트·이동벽 선택·파괴 부분 선 제거

- Related Files:
  - `src/game/visual-assets.js` :: `VISUAL_ASSET_MANIFEST / asset loader` — modify
  - `src/game/renderer.js` :: `drawObstacle / drawSpecialTimingGuide / drawProjectile / drawEnemy` — modify
  - `src/game/laser-renderer.js` :: `drawLaser / drawLaserGuidance` — modify
  - `src/game/visual-materials.js` :: `moving atlas slices / projectile and single laser crop / clipWallBreach` — new
  - `src/game/visual-theme.js` :: `laser stage color` — read-only
  - `public/assets/game/walls/moving-wall-a.png` :: `approved atlas A bytes` — new
  - `public/assets/game/walls/moving-wall-b.png` :: `approved atlas B bytes` — new
  - `.memory/validation/2026-11-02-v01-asset-render-review-v3/materials.mjs` :: `clipWallBreach / crop reference` — read-only
  - `.memory/validation/2026-11-02-v01-asset-render-review-v3/asset-analysis.json` :: `projectile/laser source core bounds` — read-only
  - `.memory/validation/2026-10-30-v01-moving-wall-playtest/wall-art.mjs` :: `atlas mapping and body backing` — read-only

#### Details
- **Signatures & Types** (JS 구현의 계약 명세이며 TypeScript 전환 요청 아님):
```typescript
clipWallBreach(ctx:CanvasRenderingContext2D,obstacle:Obstacle,theme:VisualTheme):void;
drawMovingWallMaterial(ctx:CanvasRenderingContext2D,wall:Obstacle,assets:VisualAssets):boolean;
drawLaser(ctx:CanvasRenderingContext2D,attack:LaserAttack,options?:{guidance?:boolean;rasterScale?:number;stageId?:string;visualAssets?:VisualAssets}):void;
type AssetCore={x:number;y:number;width:number;height:number};
```
- **Data & Schema Fields**: manifest 추가 movingWallAtlases:{a:string,b:string}. 이동벽 style은 beast B/나머지 A로 고정 매핑한다. crop 표는 stageId→projectile/laser 원본 core/frame 픽셀 좌표이며 모두 유한 숫자다. 미리보기 thumbnail은 생산 자산으로 쓰지 않는다. 기존 obstacle.stageId/visualSeed를 유지한다. ctx/asset cache는 snapshot 밖에 둔다.
- **Execution Flow / Logic**:
  1. 복사원본atlas는승인playtest bytes 그대로SHA기록. 일반kind+movingGap만atlas사용,72px폭과구멍clip/어두운받침유지. 시안authunlock/gamephysics/window.wallLab등fixture는복사금지.
  2. drawObstacle기존본체/단색/재질을그대로두고특수벽테두리/사선두구간만 save→clipWallBreach→기존선→restore. half=(theme.breakOpeningHalfHeight??28)+clampedprogress*24, breakEffect .65초와같은center/범위사용. 혼합벽일반부분/구멍선/파편원은영향없음.
  3. drawSpecialTimingGuide 함수는byte동일 유지(초록면/edge/pulse). firstBossCleared조건/이미지난벽안내폭/성공상자0.30시간을임의수정금지. effect만료후닫히거나선이튀어나오는회귀는전수명프레임으로확인;실제physic영구구멍추가는금지.
  4. 투사체는검증된corecrop 기준긴변36px/비율유지로기존원반지름18의본체크기. 기존outer2ring제거,작은투명glow여백가능,피격16×11동일. unique모탄의승인큰형태는별도scale,기본탄과구별.
  5. 단일laser만실지역PNGcore/frame재질을기존18pxbeam/sweep/안전clip안에사용. drawLaser옵션stageId/assets를명시전달,미로딩시기존형태fallback. 런타임매프레임getImageData분석금지,검증정적crop메타데이터사용.
  6. 전역quarter는기존ray/filament/blur/flare연산유지+theme.laser색만. whitecore/greensafe/reddanger유지. 기존wall.stageId소유재질과bossattack.stageId를사용하여스테이지전환때기존오브젝트색갈이없게한다.
  7. ctx상태/저해상도layer좌표호환. 자산오류시판정/진행중단없이fallback,원본18이미지교체없음. provenance와선택JSON을검증산출물에기록.
- **Error / state boundary**: 예외·재시작·무효입력 처리는 위 흐름대로 기존 게임을 멈추거나 다른 run 상태를 덮어쓰지 않아야 한다. 새 DB migration/외부 계정 설정 없음.

### I02. 동작·회귀 검증

- Related Files:
  - `tests/game/visual-assets.test.js` :: `T06 behavioral coverage` — modify
  - `tests/game/renderer.test.js` :: `T06 behavioral coverage` — modify
  - `tests/game/laser-safety.test.js` :: `T06 behavioral coverage` — modify
  - `tests/integration/central-hitbox.test.js` :: `T06 behavioral coverage` — modify

#### Details
- 6지역×5종×intact/broken/late. guide소스동일/초록alpha동일,파괴선alpha0/바깥양수,intact벽pixel동일. projectile core36/aspect/16x11,단일drawImage호출·quartergeometry색제외동일. stage전환기존벽재질불변.0/.65초경계/full lifetime캡처.
- 테스트는 구현 코드의 줄별 복제가 아니라 관찰 가능한 상태전이/입력/충돌/시각 결과를 검사한다.
- 미실행 항목은 limitation으로 기록한다. 승인되지 않은 새 디자인/밸런스가 필요하면 기존 승인을 확대 해석하지 말고 증거를 제시한다.

## Acceptance Criteria
- [ ] 초록안내는변하지않고파괴된부분특수벽장식선만사라진다.
- [ ] 이동벽선택·투사체·단일·전역이승인v3와동일한방식으로표시된다.
- [ ] 지정 검증 통과와 증거/제약 기록, 무관한 소스·계정·배포 변경 없음.

## Validation
- `npm test -- --run tests/game/visual-assets.test.js tests/game/renderer.test.js tests/game/laser-safety.test.js tests/integration/central-hitbox.test.js` — 종료코드0 및 대상 검증 통과.
- 실제 브라우저 시각·입력 검증 및 승인 시안 비교 결과를 `.memory/validation/2026-11-02-v01-gameplay-visual-polish/`에 기록한다. 테스트 통과를 스크린샷 확인 대신 사용하지 않는다.

## Commit Message
```text
feat(visuals): integrate approved wall and attack materials

Plan: 2026-11-02-v02-feedback-release
Phase: P01-game-experience
Task: T06-approved-art-and-wall-breach

- 승인 v3 아트·이동벽 선택·파괴 부분 선 제거 적용 및 경계 사례 검증
- 승인 결정과 기존 게임 규칙 보존
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending

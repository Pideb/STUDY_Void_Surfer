# T01 stage silhouette outline

## Status: done

## Implementation

- `src/game/projectile-outline.js`: `createProjectileOutlineCache({canvasFactory?})` / `get(image,frame,width,height,color)`. 2배 작은 raster에 alpha 마스크를 만들고 테마색1.75px·어두운 분리선2.75px 실루엣 확장. WeakMap 이미지 캐시, 팔레트/크기/소스 변경 시 분리. 지원하지 않는 canvas는 기존 그림으로 안전한 fallback.
- `src/game/visual-materials.js::drawRestoredProjectile`: 기존 crop·위치·크기·회전·원본 draw는 유지하고 캐시된 테두리를 바로 아래에 그린다. 테두리색은 getStageVisualTheme(stageId).projectile.
- 충돌·게임 로직·단일/전역 레이저·음원·운영 버전은 변경하지 않는다.
- `tests/game/projectile-outline.test.js`: 캐시 재사용, 크기/테마/이미지 분리, canvas 실패 복구. 기존 renderer·레이어 테스트로 타기팅 원/판정 변경 없음 확인.
- `.memory/validation/2026-11-02-projectile-outline/`: 변경 전 소스 보존, 실제6지역 렌더러 비교·모바일/FHD 이미지·픽셀 테두리 확인·한계.
- `docs/management/preview-catalog.json`: 선별 개발 시안 보관 지침에 따라 실제 렌더러 비교 링크와24캡처 의존성을 등록. 공개 게임/가이드에는 포함하지 않음.

## Validation

- renderer/outline/render-layers 및 projectile-phases·boss-unique-attacks 관련 테스트.
- `npm run build` / `npm run verify:config`.
- 실제 브라우저6지역·36/62크기·반환 회전, 원본 source/gameplay SHA 보존 및 캐시 재사용 검증.

## Results

- 게임 관련158 tests 및 문서20 tests, build/config 통과.
- 실제 renderer24캡처·테마색 외곽 픽셀12사례 확인. 캐시 예열 후6000회 draw에서 픽셀 읽기0회. 모바일 산업 장면 전후 육안 확인, 런타임 예외0.
- [비교](../../../validation/2026-11-02-projectile-outline/review.html), [검증](../../../validation/2026-11-02-projectile-outline/report.md). 물리·판정 파일과 원본 sprite 보존.
- commit: see Git log (Task header); no deployment

## Commit

```text
feat(render): outline projectile sprites with stage colors

Plan: 2026-11-02-projectile-outline
Phase: P01-rendering
Task: T01-stage-silhouette-outline
```

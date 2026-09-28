# Task: T02 Integrate Stage Art Packs

## Status: done

## Goal

Make the renderer use the correct local background, wall, boss, projectile, and laser asset for every stage ID without changing gameplay geometry.

## Implementation

### I01. Extend the manifest and tests

- Related Files:
  - `src/game/visual-assets.js` :: `VISUAL_ASSET_MANIFEST`; add all five stage maps.
  - `tests/game/visual-assets.test.js` :: manifest/preload coverage; update expected entry count and paths.

#### Details

- Each stage map must expose exactly `background`, `bossBackground`, `normalWall`, `specialWall`, `boss`, `projectile`, and `laser`.
- Keep loader failure isolation and fallback behavior unchanged.

### I02. Generalize renderer asset selection

- Related Files:
  - `src/game/renderer.js` :: `drawObstacle`, `drawStageBackground`, `drawBoss`, `drawProjectile`, `drawLaser`; modify stage lookup to use the current stage’s manifest entry rather than a Crystal Gates-only branch.
  - `tests/game/renderer.test.js` :: add per-stage image draw assertions and fallback assertions.

#### Details

- Resolve all image keys as `stages.${stageId}.${assetName}`.
- Keep procedural fallback for missing files and preserve clipping/tile behavior.
- Do not mutate snapshot objects or collision fields during rendering.

## Acceptance Criteria

- [ ] Every stage selects its seven local assets when loaded.
- [ ] A missing stage asset falls back only for that layer.
- [ ] Existing renderer and collision behavior remains unchanged.

## Validation

- `npm run test -- --run tests/game/visual-assets.test.js tests/game/renderer.test.js`
- `npm run build`

## Commit Message

```text
feat(render): wire all stage art packs

Plan: 2026-09-28-game-visual-assets-and-flow-fixes
Phase: P01-asset-expansion
Task: T02-integrate-stage-art-packs

- map all six stages to local image assets
- preserve per-layer procedural fallbacks
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending

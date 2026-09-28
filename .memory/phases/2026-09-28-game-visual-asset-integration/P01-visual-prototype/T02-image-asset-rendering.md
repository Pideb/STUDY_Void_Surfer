# Task: T02 Image Asset Rendering

## Status: done

## Goal

Load the committed P01 image files and render the menu, aircraft, CRYSTAL GATES walls, boss, projectile, and laser as real image layers while leaving gameplay model and collision calculations unchanged.

## Decision Summary

- Keep rendering on the existing 960×540 Canvas and render DOM UI separately.
- Failed/missing images must not block startup: keep the current procedural renderer as an explicit fallback for that asset and expose failed paths for test/diagnostic reporting.
- Runtime collision bounds continue to come only from snapshots; drawn art may be clipped or scaled to fit but cannot write back to entity state.

## Implementation

### I01. Add a deterministic image asset store

- Related Files:
  - `src/game/visual-assets.js` :: `VISUAL_ASSET_MANIFEST`, `createVisualAssetLoader` — new local image manifest and injectable loader.
  - `tests/game/visual-assets.test.js` :: loader success/failure/path tests; new.

#### Details

- Manifest paths:
  - `menuBackground`: `/assets/game/menu/space-background.png`.
  - `aircraft.default|velocity|aegis`: paths under `/assets/game/aircraft/`.
  - `stages['crystal-gates']`: `background`, `bossBackground`, `normalWall`, `specialWall`, `boss`, `projectile`, and `laser` map to the same-named files from T01.
- API contract:
  ```js
  export function createVisualAssetLoader({ manifest = VISUAL_ASSET_MANIFEST, imageFactory = () => new Image() } = {})
  // returns { preload(): Promise<{ loaded: string[], failed: string[] }>, get(path): CanvasImageSource | null, getFailures(): string[] }
  ```
- `preload()` starts each unique manifest URL once, resolves after all load/error events, and never rejects for an individual missing image. Cache successes by URL, deduplicate repeated URLs, and preserve a stable list of failed URLs.
- `imageFactory` returns an image-like object with `src`, `onload`, and `onerror`; it enables deterministic tests without a network or real browser image decoder.

### I02. Connect assets to app startup and Canvas rendering

- Related Files:
  - `src/main.js` :: non-callback app startup, construct/preload loader before controller mount; modify.
  - `src/game/renderer.js` :: `createRenderer`, `drawShip`, `drawObstacle`, stage background/boss/projectile/laser helpers, `renderMenuBackground`; modify.
  - `tests/game/renderer.test.js` :: image draw/fallback/hitbox-independence assertions; modify.

#### Details

- Change renderer signature to `createRenderer(canvas, { visualAssets = null } = {})`; existing callers/tests without assets retain deterministic procedural output.
- For ready assets use `ctx.drawImage` only at render time. Draw the menu background asset full-bleed, use the shared transparent aircraft asset for the cruising menu ship/player, and use the Crystal normal or dedicated BOSS background plus object assets based on `stage.id`, `stage.mode`, and `aircraft.id`.
- Normal wall art must be clipped and tiled inside only the engine-provided top/bottom solid rectangles. Special wall art is clipped to `obstacle.x..x+width`; the engine gap, `breakEffect`, timing guide, and collision geometry stay unchanged. Preserve all current numeric entity fields.
- Boss/projectile/laser art is positioned and sized from the current render snapshot. Preserve charge telegraph, trajectory dots, boss health UI, reflection path, laser warnings, and visual hit feedback as overlays where necessary.
- On app startup, preload before mounting the signed-in flow, but continue to login/menu if any asset fails. The renderer uses the original draw functions only for missing assets.
- Do not bundle remote image URLs, new image service dependencies, or generated text in game art.

## Acceptance Criteria

- [x] Successfully loaded image assets reach `CanvasRenderingContext2D.drawImage` in the expected layer order.
- [x] One missing asset falls back only for that visual; loader failures resolve and do not block startup or other loaded images.
- [x] Rendering frozen player, obstacle, and projectile snapshots leaves their fields unchanged; rendering does not call gameplay collision logic.
- [x] With no `visualAssets`, all existing renderer tests and current procedural fallback behavior remain valid.

## Validation

- `npm run test -- --run tests/game/visual-assets.test.js tests/game/renderer.test.js` passed: 17 tests across both files.
- `npm run test -- --run` passed: 150 tests across 29 files.
- `npm run build` passed; verified Vite copied all eleven `/assets/game/...` files from `public/` into `dist/`.

- `npm run test -- --run tests/game/visual-assets.test.js tests/game/renderer.test.js` — all new loader/render contract tests pass.
- `npm run build` — Vite serves every `/assets/game/...` path from `public/`.

## Commit Message

```text
feat(render): load and draw prototype game art assets

Plan: 2026-09-28-game-visual-asset-integration
Phase: P01-visual-prototype
Task: T02-image-asset-rendering

- preload local image assets with per-file fallback
- render sprite layers without changing collision geometry
```

## Progress

- [x] Implementation complete
- [x] Validation passed
- commit: pending

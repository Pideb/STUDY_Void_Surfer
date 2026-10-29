# Task: T01 FHD Rendering

## Status: pending

## Goal
Keep fullscreen geometry/native RAF while reducing actual rendering buffer to at most1920×1080.

## Decision Summary
- User selected global FHD, including aircraft/boss, with no60FPS limit. Existing layer densities unchanged.
- Collect before/after evidence without claiming software-headless results prove physical GPU improvement.

## Implementation
- `src/game/render-resolution.js::getRenderResolution({width?,height?,dpr?}):{width,height,scaleX,scaleY,pixelRatio}`: constants `MAX_RENDER_WIDTH=1920`, `MAX_RENDER_HEIGHT=1080`, `MAX_RENDER_PIXELS=1920*1080`. Validate CSS dimensions/fallback as before; clamp DPR1..2. Scale factor `min(pixelRatio,1920/cssWidth,1080/cssHeight)`; clamp floored dimensions>=1, preserving CSS aspect ratio. Keep960×540 logical scale and pixelRatio diagnostic. Do not upscale small views beyond prior DPR behavior.
- Existing `src/game/renderer.js::syncResolution` automatically consumes this API and updates main/reused layers on fullscreen/resize; retain scheduling and art/effect algorithms.
- `tests/game/render-resolution.test.js`:1920/2560/3840 atDPR1/2 all bounded; small640×360@3→1280×720; ultrawide7680×2160→1920×540, portrait fits1080height, invalid/tiny fallback. `tests/game/renderer.test.js`: update old2560 resize expectation, assert new transform/logical ship coordinates and stable buffer reuse. Existing layer/collision coverage retained.
- `.memory/validation/2026-10-29-fullscreen-fhd-music-start/`: actual engine/art/render/HUD fixture for matched normal and active boss at1920×1080 and3840×2160,DPR1. Before editing run baseline; afterward repeat same seeds/state/RAF count. Record backing/layer dimensions, median/p95/slow-frame count/render time and screenshots, label software-headless/GPU limits. Helpers may use a private Edge CDP profile; leave user browser/devserver alone.

## Acceptance Criteria
- [ ] New FHD bounding cap, aspect/input geometry and normal/high-DPR resize tests pass.
- [ ] Baseline/final matched evidence, native RAF retained and no unrelated renderer changes.

## Validation
- `npm test -- --run tests/game/render-resolution.test.js tests/game/renderer.test.js tests/game/render-layers.test.js tests/game/central-hitbox.test.js` (use actual hitbox path if under integration).
- Native browser harness and `git diff --check`.

## Commit Message
```text
perf(render): cap fullscreen buffers at FHD without limiting refresh rate

Plan: 2026-10-29-fullscreen-fhd-music-start
Phase: P01-runtime
Task: T01-fhd-rendering

- Preserve viewport geometry with a1920 by1080 backing-buffer limit
- Record matched fullscreen rendering evidence
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit:pending

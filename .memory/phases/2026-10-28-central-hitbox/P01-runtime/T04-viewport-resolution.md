# Task: T04 Crisp viewport-sized rendering

## Status: done

## Goal
Crisp viewport-sized rendering with observable behavior defined below.

## Decision Summary
- D05: real buffer follows displayed canvas and DPR; logical world and gameplay coverage unchanged.
- Source: .memory/decisions/2026-10-28-central-hitbox.md. Preserve other existing behavior.

## Implementation

### I01. Production contract
- Related Files (modify/new/read-only as stated): new src/game/render-resolution.js :: getRenderResolution; src/game/renderer.js :: resize/render/renderMenuBackground/destroy; new tests/game/render-resolution.test.js and existing renderer tests; actual-resolution review evidence in final task.

#### Details
- **Signatures, schema fields and flow**: Export getRenderResolution({width,height,dpr}):{width,height,scaleX,scaleY,pixelRatio}. Finite positive css extent or fallback960x540; DPR clamp1..2; integer physical dimensions at least1, uniform downscale when total exceeds MAX_RENDER_PIXELS=3840*2160. Preserve resulting aspect ratio within rounding. scaleX=bufferWidth/960,scaleY=bufferHeight/540 (existing full-window stretch preserved). Read actual canvas.getBoundingClientRect, fallback if no layout. Sync dimensions only on changes, restore imageSmoothingEnabled=true/quality=high and transform after resize. render and renderMenuBackground use scaleX/Y, never raw DPR; logical draw commands stay unchanged. Watch windowresize and optional ResizeObserver canvas, check DPR/dimensions on render to handle zoom/display changes. Cache last game snapshot/options or menu mode so resize while menu/paused redraws instead of blank. Avoid recursive resize/redraw and allocations on identical size; destroy disconnects all listeners/observer and stops redraw. Tests1080p/1440p/4K,DPR1/2/>2, tiny/invalid/no-layout, cap8.29M, changing aspect ratio. Renderer tests assert transforms, full logical coverage, smoothing, no same-size canvas reset, cached scene redraw/cleanup. No art regeneration or world-size/UI collision change.
- **Validation & errors**: reject invalid/non-finite coordinates/times without granting success; unavailable actions do not consume resources. Handle missing scene/context layouts safely. No backend/schema dependency.
- **State/return**: public snapshots remain detached; operations reflect real state without mutation hooks; visual and actual geometry agree.

### I02. Verification
- Related Files: associated existing tests listed above; new test paths are explicit.
- Exercise exact boundaries and changed behavior plus existing adjacent regressions. Do not silently delete meaningful checks.

## Acceptance Criteria
- [x] Production behavior matches all stated values/edge cases.
- [x] Specified validation passes.

## Validation
- `npm test -- --run tests/game/render-resolution.test.js tests/game/renderer.test.js tests/game/portal-renderer.test.js tests/app/create-app.test.js` - each command must succeed; semicolon-separated commands run sequentially.
- `git diff --check`

## Commit Message
```text
feat(game): viewport resolution

Plan: 2026-10-28-central-hitbox
Phase: P01-runtime
Task: T04-viewport-resolution

- Crisp viewport-sized rendering
- Validate approved mechanics and preserve adjacent guarantees
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

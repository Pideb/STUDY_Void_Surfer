# Task: T03 Measured Render Density Layers

## Status: pending

## Goal
Reduce non-critical raster work at the approved densities, keep ships/boss/UI sharp and warning geometry clear, and produce honest matched before/after performance evidence.

## Decision Summary
- D04: player/boss/UI100%, wall75%, projectile50%, laser35%, background50% of current physical WIDTH and HEIGHT. This is not lower FPS or smaller hitboxes.
- One native primary canvas currently draws everything. Use reusable offscreen raster surfaces; no asset quality reduction for the player or boss. Preserve draw ordering/alpha/clip and fallback when offscreen APIs are unavailable.

## Implementation

### I01. Collect baseline BEFORE source changes
- Related Files:
  - New `.memory/validation/2026-10-29-flight-performance-lasers-siren/performance.html`, `performance.mjs`, capture/serve scripts and baselineJSON/PNGs — execution-stage evidence only.
  - `src/game/renderer.js` :: existing `createRenderer`; `src/game/visual-assets.js` :: `createVisualAssetLoader` — baseline imports read-only first.

#### Details
- Before modifying production renderer, use actual engine snapshots and all loaded production assets to benchmark matched normal/wall, many-projectile, activeglobal-laser/failure scenes at desktop1440x900 and landscape700x400 plus DPR2 desktop if feasible. Gravity0/invincibility fixtures are allowed and labeled; snapshot geometry never changed to claim production behavior.
- Persist snapshots/configuration/seed/viewport/DPR/browser/backend/missingAssets and baselinecommit. Warm up>=60 frames, measure>=180 renders per scene with consistent scheduling; record median/p95 draw duration, actual loop frame intervals and raster pixel budgets. Do not call JS draw duration a GPU completion/FPS guarantee; optional forced readback timings must be labeled and identical in both samples.
- Native Edge headless with an owned temp profile is available; Vite127.0.0.1:4186 was running during planning. Check availability rather than assuming it. Do not control/close user browser sessions. Do not use a preview-only shader as the baseline.
- If baseline is not collected before implementation, recover the original renderer in a read-only isolated checkout or comparison bundle and document exact commit; do not fabricate a before result.

### I02. Reusable raster surfaces and full-resolution guidance
- Related Files:
  - New `src/game/render-layers.js` :: `createRenderLayers`; modify `src/game/render-resolution.js` only if a shared pure dimension helper is useful.
  - `src/game/renderer.js` :: `createRenderer`, `syncResolution`, `render`, `renderMenuBackground`, `destroy`, obstacle/projectile drawing helpers — modify.
  - `src/game/laser-renderer.js` :: `drawLaser`, new `drawLaserGuidance` — modify.

#### Details
- Exact proposed API (plain JS objects):
  - `RENDER_DENSITIES = Object.freeze({background:.5,walls:.75,projectiles:.5,lasers:.35})`.
  - `createRenderLayers({canvasFactory?: (width:number,height:number)=>CanvasLike|null,densities?:Record<string,number>}={}): {resize(resolution:{width:number,height:number}):void, paint(ctx:CanvasRenderingContext2D,name:string,draw:(layerCtx:CanvasRenderingContext2D)=>void):void, destroy():void, getStats():Record<string,{width:number,height:number,density:number}>}`.
  - Extend `createRenderer(canvas,{visualAssets=null,reducedMotion=null,layerCanvasFactory,renderDensities}={})`; omitted options usebalanced profile. Evidence can pass all1 for a diagnostic reference; no new user-facing quality menu.
- For each named layer allocate lazily and reuse one surface. Physical layer dimensions=max(1,floor(primaryPhysicalDimension*density)); scale its context by width/960,height/540. Clear before each use, reset transform/composite/filter/alpha/shadow/clip via balanced save/restore and clear in physical coordinates. Composite once into primary's existing world transform with dest0,0,960,540. Never resize per frame, allocate per projectile, nest full-DPR scaling twice or change native primary resolution.
- OffscreenCanvas first or detachedHTMLCanvasElement; guard missing/throwinggetContext or invalidsurface and fall back to direct primary drawing. Tests can inject a factory; do not rely on JSDOM fake primary context as a real raster surface. Clean owned surfaces/references and ResizeObserver/listeners on destroy; resizing updates only changed physical sizes. Invalid density uses knownprofile/default, notNaN/huge dimensions.
- Preserve exact composition order: background/atmosphere lowdensity → portal ornaments at appropriatebackground layer → walls75% → their thin special timing guidance native → boss-entry blackout → enemy lasers35% + native guidance → projectile bodies50% + native trajectory guidance → boss100% → player/trail/dash/death100% → player manual laser35% in its original foreground position → challenge/failure effects → essential native cooldown/debug/guidance redraw → portal overlay. Keep manual charge point centered on the real nose and actual ray at recordedfromY.
- Refactor `drawLaserGuidance(ctx,attack)` to own readable warning dashed lines, safe boundaries/chevrons and danger hatching; body/glow remainslowdensity. Extend `drawLaser(ctx,attack,{guidance=true}={})` to preserve existing all-pass callers; the renderer calls `drawLaser(layerCtx,attack,{guidance:false})` for the low-density body and `drawLaserGuidance(primaryCtx,attack)` separately for native guidance. Two-line recursion must passoptions. No duplicate warning/halo passes or removed combattext.
- Similarly separate projectile preview line/dots from projectilebody and special timingband edges fromwallbody. Guidance remains geometric at logical coordinates and need not be blurred. No duplicate full-resolution expensive beam/body redraw above failureeffects: reuse layer or body layer at its approveddensity, then reapply clear guidance. Failure effects remain partial/readable and draw order unchanged.
- Main menu background uses background50%; actual menu aircraft/logo/UI remainnative through existing UI/hero pipeline. All six stage/boss backgrounds use the same policy, including procedural fallback/portaltransition. Do not lower boss rig crop preparation or player sprite source quality.
- Keep `drawObstacle`, `drawShip`, `drawBoss`, `drawManualLaser` public signatures backward-compatible where feasible; extra options default oldall behavior. Do not change collision/telegraph thickness/scale, rate of physics, HP, points, textures' logical size or boss motion.

### I03. Matched validation and performance result
- Related Files:
  - New `tests/game/render-layers.test.js`; modify `tests/game/render-resolution.test.js`, `tests/game/renderer.test.js`, `tests/game/portal-renderer.test.js` only for new orderedpasses.
  - Same evidence harness as I01; postJSON/PNGs, performance comparison report — new.

#### Details
- Verify exact dimensions at960x540/nativeDPR2/odd viewport, allocation reuse, resize-only reallocation, cleanup, factory/API failure fallback, no transform/clip/filter leakage, primary ship/boss draw targets and layer ordering. Native warning coordinates must match attack/collision data at every quarter; debugbox staysnative/explicitonly.
- After changes rerun identical scenes/configuration/warmup/measurement and all1 diagnostic reference. Capture actual PC/landscape PNGs and zoomed ship/boss/wall/projectile/laser comparisons. Record labelsoutsideproduct, not new HUD text.
- Compare background/wall/projectile/laser pixel budgets: respectively25%,56.25%,25%,12.25% of old dimensions' pixel area before rounding. Ship/UI unchanged. Report observed timing ranges and caveats. If composition regresses or excessive overdraw remains, improve reuse/skip empty passes/cache safe effects while preserving approved look; do not claim unmeasured FPS gains or silently abandon required density ordering.

## Acceptance Criteria
- [ ] Actual layer dimensions match selected profile and native player/boss/UI retain original clarity.
- [ ] No guidance/collision/order regression; surfaces reused and cleaned; matched baseline/post evidence recorded honestly.

## Validation
- `npm test -- --run tests/game/render-layers.test.js tests/game/render-resolution.test.js tests/game/renderer.test.js tests/game/portal-renderer.test.js tests/game/laser-safety.test.js tests/integration/central-hitbox.test.js tests/integration/mobile-input.test.js`
- Run browser evidence harness fromI01/I03 and review measured JSON/actual screenshots.
- `git diff --check`

## Commit Message
```text
perf(render): rasterize scenery and hazards at differentiated densities

Plan: 2026-10-29-flight-performance-lasers-siren
Phase: P01-runtime
Task: T03-render-density

- Preserve native ship boss and UI clarity with reusable raster layers
- Keep warning geometry sharp and record matched rendering measurements
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

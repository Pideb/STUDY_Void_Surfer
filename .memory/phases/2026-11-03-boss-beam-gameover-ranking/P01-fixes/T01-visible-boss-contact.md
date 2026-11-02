# T01 visible boss contact

## Status: done

## Results
81 targeted tests pass; build passed. Real Chromium six approved PNGs, nine motion/action/reduced-motion cases each: 215 old-envelope false contacts found; 10,674 fully clear beam rows remain misses with zero mismatches. Actual hits and once-per-shot HP verified. Alpha read27 total for all layers, no added reads during warm shot queries. Evidence: `.memory/validation/2026-11-03-boss-beam-gameover-ranking/boss-browser.json` and montage. Rendering fallback circular boss remains supported when raster unavailable.

## Goal / Decision Summary
Replace full rectangular envelope damage with visible articulated silhouette contact. Reproduce transparent-row damage and prove it misses. Preserve timing/damage/motion.

## Implementation
### I01 Cached artwork silhouette
- `src/game/boss-hit-mask.js` new: `createBossBeamContact(visualAssets): (input)=>boolean`, reads `visualAssets.get('stages.'+stageId+'.boss')`; prepareBossRig supplies the same base/parts used by renderer. Rasterize once to192x128 alpha, threshold64, identical row runs merged vertically. Beast base split into64 strips for matching tail warp. Cache by image/stage; no per-frame getImageData. Missing raster/image falls back to renderer's procedural circular boss.
- Shape `{base:Rect[],parts:Rect[][]}`, normalized Rect `[left,top,right,bottom]`. No account/server data.
### I02 Collision and wiring
- `src/game/boss-beam.js` `intersectsBossBeam({...existing,silhouette})`: sample actual poses within active interval (240Hz + sine turnarounds), horizontal beam rectangle fromX+28..WORLD_WIDTH, fromY±4 vs transformed mask rectangles using convex intersection. Never union unrelated extrema into a swept hit rectangle. Match getBossPartTransform/recoil/beast64-strip warp. Retain getBossArtBounds only for diagnostics.
- `src/main.js` inject `bossBeamContact:createBossBeamContact(visualAssets)` into createGameEngine; `src/game/game-engine.js` updateBossWeapon uses dependency or pure default.
- `tests/game/boss-beam.test.js`, new mask tests: internal holes/corners vs real contact, origins/invalid args, moving parts, between-tick crossing. Existing weapon tests preserve one hit/shot and no charge damage. Real-browser six-sprite check uses actual renderer and warmed cache.

## Acceptance Criteria
- [ ] Transparent regions miss, visible body/parts hit.
- [ ] No timing/damage balance change or per-frame pixel reads.
- [ ] Six-stage browser evidence and regressions pass.

## Validation
`npm test -- --run tests/game/boss-beam.test.js tests/game/boss-hit-mask.test.js tests/game/boss-weapon.test.js tests/game/game-engine.test.js`
`npm run build`

## Commit Message
```text
fix(game): match boss beam damage to visible articulated artwork

Plan: 2026-11-03-boss-beam-gameover-ranking
Phase: P01-fixes
Task: T01-visible-boss-contact
```

## Progress
- [x] implementation
- [x] validation
- commit: aeb3ac6

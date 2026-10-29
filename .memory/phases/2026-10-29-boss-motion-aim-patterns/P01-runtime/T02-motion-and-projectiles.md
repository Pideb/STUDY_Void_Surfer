# Task: T02 Boss Motion and Projectile Telegraphs

## Status: done

## Goal
Actual bosses move20..80% every6s with noticeable articulated actions, and every projectile launches from the correctly moving muzzle on its committed advertised path.

## Decision Summary
- D04..D06: no charge-only movement pause; one shared pose/geometry for art/effects/origins. Existing pause/WASD clock freezes preserved.

## Implementation
### I01. Shared geometry and articulation
- Related Files: `src/game/boss-geometry.js`,`src/game/boss-motion.js`,`src/game/boss.js`,`src/game/game-engine.js`,`src/game/renderer.js` — modify; `src/game/boss-rigs.js` read-only.
- Extend `getBossGeometry(stageId,entranceProgress=1,motionSeconds=0)` returning existing box/center/core/muzzle with y translation162*sin(2*pi*seconds/6). Center108..432, nominal art box44..496. Keep default0 backward-compatible.
- Encounter `motionSeconds:number=0`, advanced only by live post-entrance delta; shared geometry exposed in snapshot and used by renderer/engine. Deep-copy geometry so external mutation cannot affect engine.
- Export pure articulation transform helper from boss-motion for prepared parts: idle amplitude3x, opening1.7x, slide/lift/recoil2x as demonstrated; boost tail movement in same family. Keep source assets/nominal size. Renderer/effects receive same geometry and pose, including action recoil offsets where relevant.
- Preserve reduced-motion lighting but do not freeze actual gameplay vertical movement (otherwise drawing and hit positions diverge). Six-stage actual animations must stay onscreen at extrema.

### I02. Per-projectile moving preview and launch commit
- Related Files: `src/game/boss-signatures.js` create/update attack; engine `launchSignatureAttack` / update — modify.
- Preserve current public creation API; add optional launch-origin provider to update options, accepting a frame-relative seconds offset and returning `{x:number,y:number}`. Without provider, existing static-path unit fixtures remain valid.
- Projectile stores immutable creation template offset/curve/target/delay plus `launched:boolean=false`. During charge reproject preview from current muzzle; at exact individual delay+1.1 launch, sample provider at that offset, rebuild advertised polyline, freeze it, mark launched. Already-flying paths never follow later muzzle motion.
- Recompute finite conservative lifetime including delays and new muzzle positions; preserve220..360 speed,1 wall shot/3..6 wall-free, actual polyline swept damage/protection expiry/offscreen travel. Coarse frames must commit at launch instant, not next frame end.
- Action pose charge/fire should reflect delayed shots (not only the first); roar source follows current moving geometry. No new sounds/music composition.

### I03. Tests
- `tests/game/boss-motion.test.js`,`tests/game/boss-signatures.test.js`,`tests/game/game-engine.test.js` — modify/add.
- All stages extrema/center and common offsets; pause/WASD clocks; visible part changes and no geometry mutation.
- Moving preview updates before launch, staggered shots capture different muzzle origins, committed paths stable, long/coarse tick resolves, old no-provider fixtures unchanged.

## Acceptance Criteria
- [x] Actual movement/art/effects share geometry; all six bosses visibly articulated.
- [x] Moving telegraphs commit per shot with no homing/tunneling/stall.

## Validation
- `npm test -- --run tests/game/boss-motion.test.js tests/game/boss-signatures.test.js tests/game/game-engine.test.js`
- `git diff --check`

## Commit Message
```text
feat(boss): share live motion across artwork and projectile origins

Plan: 2026-10-29-boss-motion-aim-patterns
Phase: P01-runtime
Task: T02-motion-and-projectiles

- Animate full boss travel and stronger stage-specific actions
- Follow moving muzzles during previews and commit each launched path
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: fe43080

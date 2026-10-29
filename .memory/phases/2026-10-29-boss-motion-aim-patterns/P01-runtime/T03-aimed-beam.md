# Task: T03 Aimed Horizontal Player Beam

## Status: done

## Goal
Player faces right, charges.5s, fires a horizontal beam for.2s and damages the moving whole boss at most once on real contact; misses do not damage.

## Decision Summary
- D07, not a new homing/reflection mechanic. Preserve.7s movement lock,10s charge, one shot, damage3 AEGIS/1 others, live threats and boss reward exactly once.

## Implementation
### I01. Shared full-art bounds and swept beam contact
- Related Files: `src/game/boss-geometry.js` full-art bounds; `src/game/boss-motion.js` pure part transform; new `src/game/boss-beam.js`; `src/game/boss-weapon.js`; engine manual weapon update; renderer `drawManualLaser` and facing — modify/new.
- Full boss damage envelope includes nominal192x128 artwork and transformed articulated polygon extents (all parts/wings), not small core. Empty space exterior to this envelope is not hit. Keep pure geometry so engine/tests need no raster DOM readback. No visible hitbox in ordinary play.
- `intersectsBossBeam({shot,stageId,fromMotionSeconds,toMotionSeconds,animation,...}):boolean` checks rightward ray from recorded nose x+28,y toWORLD_WIDTH with8px contact thickness against full moving art envelope. Include sinusoidal extrema and bounded sub-frame pose samples/swept vertical intervals; no missed crossing between frame samples.
- `advanceBossWeapon(weapon,deltaSeconds,hitTest=()=>false):boolean`: compute active overlap within shot elapsed.5..7, call predicate with shot and frame-relative interval. Return true/setimpacted only on first contact; allow later contact if initial firing instant misses. At.7 clear firing; invalid delta/shot guards unchanged.
- Engine always supplies real hit predicate from same motion clock. Separate/update manual damage AFTER fatal boundary/wall/enemy damage so a dead ship cannot score a later frame hit. Preserve exactly-once lethal hit/clear and existing pause/WASD recharge freezes.
- Fire records horizontal `fromY/toY` and endpointWORLD_WIDTH, no core targeting. Render ship.facingAngle0 while firing; draw horizontal charge/beam, never truncate to moving boss core. Beam penetrates walls as before.

### I02. Tests and affected fixtures
- `tests/game/boss-weapon.test.js`,`tests/integration/manual-boss-fire.test.js`,`tests/game/renderer.test.js`; new `tests/game/boss-beam.test.js` — modify/new.
- Verify.499 no damage,.5 boundary, late hit within.2, no damage miss/refund/homing, exactly once over multiple frames, high/coarse-motion crossing, full wings/envelope contact, AEGIS3HP on single real hit, live wall contact fatal, no ghost damage after death, partial-frame.7 unlock.
- Existing auto-hit fixture loops must aim using public live boss geometry/ship lift in deterministic test harness; do not bypass production hit detection or shrink movement.

## Acceptance Criteria
- [x] Horizontal art/physics agree and real misses preserve boss HP.
- [x] All damage/clear/input/recharge invariants pass with swept full-body hit tests.

## Validation
- `npm test -- --run tests/game/boss-beam.test.js tests/game/boss-weapon.test.js tests/integration/manual-boss-fire.test.js tests/game/renderer.test.js`
- `git diff --check`

## Commit Message
```text
feat(combat): require horizontal beam contact with the moving boss

Plan: 2026-10-29-boss-motion-aim-patterns
Phase: P01-runtime
Task: T03-aimed-beam

- Hit the full boss only during the active beam interval
- Keep right-facing firing and exactly-once aircraft damage
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

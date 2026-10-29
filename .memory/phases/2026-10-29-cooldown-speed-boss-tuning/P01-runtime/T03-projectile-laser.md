# Task: T03 Projectile Counts and Laser Margins

## Status: done

## Goal
Each wall-free volley randomly contains3..6 projectiles, while wall-flight attacks remain single shots; all line-laser cores stay inside the central70% height.

## Decision Summary
- Existing stage templates hardcode3/4/5 shots, and only projectileCount1 currently works. Extend templates to count, not just slice fixed arrays.
-15% per-edge restriction applies to line lasers including two-line, not quarter/global lasers.

## Implementation
### I01. Count-aware six-stage signatures
- Related Files: `src/game/boss-signatures.js` :: `pattern`, `createSignatureAttack`; `src/game/game-engine.js` :: `launchSignatureAttack`, `scheduleBossAttack` — modify/audit.
#### Details
- Keep `createSignatureAttack({id,stageId,bossNumber,playerX,playerY,bossX,bossY,rng,projectileCount}):attack` public signature.
- Supported count override1 or integer3..6. Without valid override, sample3+floor(clamp(finite(rng(),.5),0,.999999)*4) at each volley creation. Explicit1 preserves one sampled stage path with delay0. Invalid override falls back to random valid count.
- Internal `pattern(stageId,bossNumber,count)` returns `{offset:number,delay:number,curve:number}[]`, with unique lane/curve/delay tuples.
- Crystal: simultaneous evenly spaced offset-144..144 forcount, curve0. Signal: evenly spaced-112..112, delayindex*.36. Solar: evenly spaced-108..108, delayindex*.16.
- Industrial: alternate side-dependent+/-104 offset, delayindex*.28. Abyss: alternate side-dependent +/-offset (112 for firstpair,56 later), delayindex*.32, curve sign alternates with magnitude88+24*floor(index/2).
- Gravity: same target, simultaneous curves evenly spaced-120..120; replace exact zero curve with40, retaining original3-shot[-120,40,120].
- Explicit1 may select from each stage's traditional template (Crystal5, Solar4, others3) with existing RNG, preserving wall-shot identity/delay0.
- Preserve per-shot220..360 speed rolls, center clamp168..372,33-point preview/actual polyline, unique IDs, sticky hit/collision/protection handling, flight to screen edge.
- Recompute existing duration upper bound from every generated projectile speed/delay. Do not change boss wave/repetition budget1..3, charge1.1 or global/roar/WASD ordering.
- Engine already passes1 for wall attacks andundefined for wall-free; retain this distinction. RNG clamping prevents invalid array/count behavior; no external exception/I/O.

### I02. Line-laser exclusion
- Related Files: `src/game/constants.js` :: `BOSS_LINE_LASER_EDGE_FRACTION` change.1->.15; `src/game/boss-attacks.js` :: `findSafeLaserY`, `createSingleLaser` — audit.
- Full damaging core stays y81..459 in540px world;18px beam centers90..450. Decorations do not affect damage.
- Preserve moving-gap envelopes, two-line separation and fallback2->1->null. Quarter laser timings/safe quarters unchanged.

### I03. Tests
- Related Files: `tests/game/boss-signatures.test.js`, `tests/game/laser-safety.test.js`, `tests/integration/projectile-phases.test.js` — modify.
- Historical stage-specific geometry fixtures may explicitly request their historical3/4/5 counts; collision fixture needing middle shot uses explicit5. Default production no-count test MUST verify random3..6 for all six stages with deterministic count rolls0/.25/.5/.75/1.
- Verify paths finite, distinct relevant trajectories/delays, delayed sixth shot launches and finishes, no leftover collision after resolution, all counts finish with coarse and fine deltas, wall shots remain exactly1.
- Actual boss-cycle integration observes mixed wall-free counts, passes through signature to roar/WASD/new waves, and never emits multi-shot wall attacks. Preserve repetition1..3.
- Laser tests sample many RNG values with whole-core81..459 checks, both one/two-line, safe moving gaps and fallback skip; global tests unchanged.

## Acceptance Criteria
- [x] Random3/4/5/6 supported for every stage without repeated identical trajectories.
- [x] Wall shots1, full preview/flight/cycle completion retained.
- [x] All line cores restricted to81..459 with safe-route rules intact.

## Validation
- `npm test -- --run tests/game/boss-signatures.test.js tests/game/laser-safety.test.js tests/game/boss-attacks.test.js tests/integration/projectile-phases.test.js tests/game/game-engine.test.js` — pass.
- `git diff --check` — clean.

## Commit Message
```text
feat(boss): randomize volleys and tighten line laser placement

Plan: 2026-10-29-cooldown-speed-boss-tuning
Phase: P01-runtime
Task: T03-projectile-laser

- Generate three to six stage-specific shots per wall-free volley
- Exclude the top and bottom fifteen percent from line lasers
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

# Task: T01 Shared16x16 damage geometry

## Status: pending

## Goal
Shared16x16 damage geometry with observable behavior defined below.

## Decision Summary
- D01/D02/D04: all actual damage and vertical clearance use the same central square; artwork/physics dimensions stay36x24.
- Source: .memory/decisions/2026-10-28-central-hitbox.md. Preserve other existing behavior.

## Implementation

### I01. Production contract
- Related Files (modify/new/read-only as stated): new src/game/player-geometry.js :: getPlayerBounds/getSpecialSuccessBounds; src/game/constants.js; src/game/collision.js; src/game/player.js; src/game/boss-signatures.js; src/game/boss-attacks.js; src/game/game-engine.js :: startGlobalShot/scheduleBossAttack/dash; renderer debug via existing getPlayerBounds; existing geometry/player/boss/renderer tests.

#### Details
- **Signatures, schema fields and flow**: Export getPlayerBounds(player:{x:number,y:number}):Bounds|null and getSpecialSuccessBounds(player):Bounds|null. Bounds is {left,right,top,bottom:number}; reject missing/non-finite coordinates. Constants PLAYER_HITBOX_SIZE16, PLAYER_SUCCESS_WIDTH56, PLAYER_SUCCESS_HEIGHT36. Bounds axis aligned, no front trim. Keep player.width36/height24 exclusively existing visual/physics uses. collision reexports getPlayerBounds for existing consumers. Replace duplicated projectile boxes, laser vertical/horizontal checks and screen boundary tests with shared bounds, preserving inclusive projectile/laser contact and existing strict wall-overlap convention. Boundaries remain fatal at top<=0 or bottom>=540. Signature swept intersection and immunity split keep current behavior with smaller square. Hybrid solids and vertical containment use16px; quarter-laser reachability and single-laser safety receive16px player height. Do not use56px box for damage. Preserve shape size/render scaling, gravity, lift, trail/rings. Update existing tests whose old33x24 coordinates are now intentionally obsolete; add meaningful wing/nose grazes, exact central edges and projectile/laser/body consistency tests.
- **Validation & errors**: reject invalid/non-finite coordinates/times without granting success; unavailable actions do not consume resources. Handle missing scene/context layouts safely. No backend/schema dependency.
- **State/return**: public snapshots remain detached; operations reflect real state without mutation hooks; visual and actual geometry agree.

### I02. Verification
- Related Files: associated existing tests listed above; new test paths are explicit.
- Exercise exact boundaries and changed behavior plus existing adjacent regressions. Do not silently delete meaningful checks.

## Acceptance Criteria
- [ ] Production behavior matches all stated values/edge cases.
- [ ] Specified validation passes.

## Validation
- `npm test -- --run tests/game/collision.test.js tests/game/player.test.js tests/game/boss-attacks.test.js tests/game/boss-signatures.test.js tests/game/renderer.test.js` - each command must succeed; semicolon-separated commands run sequentially.
- `git diff --check`

## Commit Message
```text
feat(game): damage geometry

Plan: 2026-10-28-central-hitbox
Phase: P01-runtime
Task: T01-damage-geometry

- Shared16x16 damage geometry
- Validate approved mechanics and preserve adjacent guarantees
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

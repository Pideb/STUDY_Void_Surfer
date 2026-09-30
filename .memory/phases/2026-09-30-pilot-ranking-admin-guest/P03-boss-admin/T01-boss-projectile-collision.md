# Task: T01 Boss Projectile Collision

## Status: pending

## Goal
Make a boss projectile game over the player only when its visible body actually overlaps the player's existing collision box; a projectile that crosses the player X coordinate elsewhere is a miss.

## Decision Summary
- Retain straight return flight toward the boss and existing reflection judgment timing.
- Incoming collision body is centered and sized `16x11` world pixels; decorative glow is not collidable.

## Implementation

### I01. Projectile overlap lifecycle
- Related Files:
  - `src/game/boss-attacks.js` :: `updateFlyingProjectile`, new/exported hitbox helper; modify
  - `src/game/game-engine.js` :: boss attack update and hit resolution, `updateBossAttack`; modify
  - `src/game/collision.js` :: rectangle overlap helper only if existing helper cannot express this body; modify if needed
  - `tests/game/boss-attacks.test.js` :: target-X crossing vs actual overlap; modify
  - `tests/game/game-engine.test.js` :: miss/hit, invincibility, reflection regression; modify

#### Details
- Replace `updateFlyingProjectile` behavior that marks `hitPlayer` at target-X crossing with a neutral `missed` resolution when the projectile has passed the player's horizontal collision extent without overlapping. Keep projectile state progression explicit so the boss encounter schedules the next wave.
- Define body bounds around projectile center: `left=x-8`, `right=x+8`, `top=y-5.5`, `bottom=y+5.5`. Compare inclusively against the current player collision box; do not include renderer glow or telegraph path.
- Collision sampling occurs during `updateBossAttack` after projectile movement for that frame. If overlap occurs, set `hitPlayer=true`, transition to a terminal hit state (or the current terminal state if the existing contract requires it), then route through existing `stop('boss-projectile')` unless invincibility is enabled. Ensure one terminal resolution only.
- If no overlap after passing `targetX` plus 8px horizontal extent, mark as miss. A miss is nonfatal; advance encounter cooldown/wave state and do not damage player or boss. Reflected projectiles continue using existing straight interpolation to stored boss coordinates and reduce boss HP only through successful reflection flow.
- Keep `isProjectileInReflectionWindow` and `isProjectileReflectionSuccess` independent of physical collision bounds.

### I02. Collision regression tests
- Related Files:
  - `tests/game/boss-attacks.test.js` :: exact edge overlap and miss cases; modify
  - `tests/game/game-engine.test.js` :: ordinary fatal hit, miss continues, reflection and invincibility behavior; modify

#### Details
- Cover centered body overlap, vertical miss at same X, one-pixel edge contact, passing without collision, reflection window unchanged, and no repeated hit/game-over transitions.

## Acceptance Criteria
- [ ] Only actual `16x11` projectile-body/player overlap causes a normal-mode projectile game-over.
- [ ] A miss at the target X is nonfatal and encounter progression continues.
- [ ] Reflection timing and straight boss-bound return remain unchanged.

## Validation
- `npm test -- --run tests/game/boss-attacks.test.js tests/game/game-engine.test.js`

## Commit Message
```text
fix(boss): detect projectile hits by actual overlap

Plan: 2026-09-30-pilot-ranking-admin-guest
Phase: P03-boss-admin
Task: T01-boss-projectile-collision

- Use centered projectile body bounds for player collision
- Resolve near-misses without game over
- Preserve reflection window and boss-directed return path
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

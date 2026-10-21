# Task: T05 Boss Wave Wall Guarantee

## Status: done

## Goal
Prevent boss progression from deadlocking by guaranteeing every seven-wall boss wave contains at least the two normal walls required before the next projectile, while still guaranteeing the configured minimum of three special walls.

## Decision Summary
- Each boss wave must spawn at least `BOSS_PROJECTILE_NORMAL_WALL_COOLDOWN` normal walls and at least `warningSession.requiredSpecials` special walls.
- Count specials already spawned with `specialSpawnedCount`, not only still-unpassed special IDs; keep `specialObstacleIds` for unresolved-special attack gating.

## Implementation

### I01. Enforce boss wave composition from spawned counts
- Related Files:
  - `src/game/game-engine.js` :: `spawnObstacle` — derive remaining special/normal quotas from actual spawned counts and force whichever quota must fill the last slots; modify
  - `tests/game/game-engine.test.js` :: boss wave spawn composition tests — exercise high special-roll probability and assert the minimum normal/special composition; modify
- **Signatures & Types**:
  ```js
  function spawnObstacle(difficulty) // uses warningSession.spawnedCount and specialSpawnedCount
  ```
- **Data & Schema Fields**:
  - Reuse `warningSession.spawnedCount: number`, `specialSpawnedCount: number`, `requiredSpecials: number`, and `specialObstacleIds: Set<string>`; no new state fields.
- **Execution Flow / Logic**:
  1. Compute `remainingSlots = targetCount - spawnedCount`.
  2. Compute `remainingSpecials = requiredSpecials - specialSpawnedCount` so passing an earlier special cannot increase the required quota later in that same wave.
  3. For boss sessions compute `spawnedNormalCount = spawnedCount - specialSpawnedCount` and `remainingNormals = max(0, BOSS_PROJECTILE_NORMAL_WALL_COOLDOWN - spawnedNormalCount)`; for non-boss sessions set `remainingNormals` to zero.
  4. If remaining slots are no greater than `remainingNormals`, force a normal wall. Otherwise force a special wall if remaining slots are no greater than `remainingSpecials`; otherwise preserve existing random special selection.
  5. Preserve `specialObstacleIds` add/remove behavior, warning ratios, seven-wall target, and two-normal-wall projectile cooldown.
- **Error & Exception Handling**: Clamp remaining quotas at zero and ensure the configured minimum quotas fit within `targetCount`; do not permit a negative remaining-slot count to force extra spawns.
- **State Transition & Return**: Every complete boss wave has at least two normal walls and at least three specials, allowing attack cadence to progress under every RNG sequence.

### I02. Regress the all-special deadlock
- Related Files:
  - `tests/game/game-engine.test.js` :: `spawns a moving normal wall...` and boss wave tests — add a deterministic high-special-probability case (`rng: () => 0.4`) and inspect the completed wave; modify
- **Test Cases**:
  - With random special rolls always below the 0.5 boss chance, spawn all seven obstacles and assert at least two are normal and at least three are special.
  - Run successive waves and assert projectile attacks resume after the normal-wall cooldown.
  - Verify passing a special before the rest of the wave spawns does not inflate that wave's minimum special quota.

## Acceptance Criteria
- [ ] No RNG value can produce a boss wave with fewer than two normal walls or fewer than three special walls.
- [ ] Multiple projectile/wall waves continue under a high-special-probability deterministic RNG.
- [ ] Normal WARNING wall proportions and special obstacle resolution behavior remain unchanged.

## Validation
- `npm test -- --run tests/game/game-engine.test.js tests/game/boss.test.js` — all targeted tests pass.
- `npm test -- --run` — full suite passes.

## Commit Message
```text
fix(boss): guarantee normal walls in each boss wave

Plan: 2026-10-21-boss-flow-speed-feedback
Phase: P01-boss-gameplay-feedback
Task: T05-boss-wave-wall-guarantee

- Guarantee enough normal walls for projectile cooldown
- Count spawned specials independently from unresolved specials
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

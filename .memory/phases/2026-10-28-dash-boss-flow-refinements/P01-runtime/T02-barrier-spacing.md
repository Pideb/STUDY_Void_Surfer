# Task: T02 Reachable Mandatory Barriers

## Status: done

## Goal
Preserve ordinary-wall cadence and mandatory special-wall counts while making consecutive required dash responses at least1.2s apart under subsequent acceleration, including VELOCITY.

## Decision Summary
- D01: cooldown1s; special/hybrid mandatory response separation1.2s. Spacing affects wall generation only and must never gate projectile firing (D08 amendment).

## Implementation
### I01. Conservative travel-speed bound and spawn gate
- Related Files: `src/game/game-engine.js` :: `spawnObstacle`, `updateSpawning`, `start`, world scroll integration; `src/game/constants.js`; optional new `src/game/barrier-spacing.js` with focused tests.
#### Details
- **Signatures & Types**:
```typescript
SPECIAL_RESPONSE_INTERVAL_SECONDS = 1.2;
totalScrollDistancePx: number = 0;
lastSpecialBarrierWorldX: number|null = null;
getBarrierSpeedBound({ progressionScore, unpassedCount, distanceToPlayer, minimumScrollSpeed, minimumSpawnInterval, aircraftSpeedMultiplier }): number;
```
- **Data & Schema Fields**: internal absolute barrier coordinate=`totalScrollDistancePx + getDashBarrierBounds(candidate).x`; record on an actual special/hybrid spawn, retain across encounters and offscreen removal, reset only fresh run. Accumulate actual world scroll (not background's0.25 factor) once per live frame; freeze with physics.
- **Execution Flow / Logic**:
  1. Bound how long the new barrier can remain ahead: distance divided by a lower bound on scroll speed (minimum of current speed and0.75*capped current base*aircraft factor), plus current timing-window allowance. While score speed is monotonic, this lower bound covers boss slowdown.
  2. Bound future progression within that horizon by current progression + existing unpassed walls + ceil(horizon / aircraft's minimum spawn interval) + conservative10-point clear allowance. Clamp through getBaseSpeed(150). Multiply by maximum boss1.25 and aircraft factor (retaining full bound even when VELOCITY's fast adjustment is smaller). This avoids imposing score150 spacing from the beginning while covering reachable future speed steps. Handle nonfinite/nonpositive inputs explicitly.
  3. Accept special only if absolute coordinate gap / bounded maximum speed >=1.2. Include pure-special versus hybrid centered-barrier offsets. An unsafe optional special becomes normal; if remaining slots are needed for minimum special count, delay that spawn until eligible instead of losing quota. Do not consume the slot, reroll a burst, or accumulate catch-up spawns while blocked; normal walls keep cadence whenever a forced special is not pending.
  4. No movement/teleportation of existing walls; retain their stageId, gap behavior, counts and collision. Spawn state/count changes occur only after successful creation. Absolute spacing memory survives warning/boss boundaries and pause.
### I02. Behavioral verification
- Related Files: `tests/game/barrier-spacing.test.js` new if helper used; `tests/game/game-engine.test.js` or new `tests/game/barrier-flow.test.js`.
#### Details
- Drive three aircraft at low/60/150 progression, fast/shift bosses, deterministic extreme special rolls and alternating hybrids. Record leading-barrier passage times from snapshots; assert>=1.2 (frame tolerance only), minimum WARNING2/BOSS3 and normal2 retained, finite wave completion, no collapsed burst after delayed quota, restart clears history and pause does not advance world distance.
- Ordinary non-special spawn intervals remain2/1.4 times aircraft factor. Do not make projectile scheduling depend on spacing readiness.

## Acceptance Criteria
- [x] Mandatory barriers remain>=1.2s apart across speed changes and encounter transitions.
- [x] Wall quotas and ordinary cadence remain valid without burst/stall or existing-wall relocation.

## Validation
- `npx vitest run tests/game/barrier-spacing.test.js tests/game/barrier-flow.test.js tests/game/game-engine.test.js`
- `git diff --check`

## Commit Message
```text
fix(obstacles): preserve dash recovery between mandatory barriers

Plan: 2026-10-28-dash-boss-flow-refinements
Phase: P01-runtime
Task: T02-barrier-spacing

- Bound future approach speed and retain response spacing across encounters
- Preserve special quotas without catch-up spawn bursts
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: 003c23e

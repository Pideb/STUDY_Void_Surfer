# Task: T01 Safe Laser Engine

## Status: done

## Goal
Single lasers coexist safely with moving walls; quarter lasers have no walls on screen, with collision following the light front.

## Decision Summary
One opportunity per boss wave after boss 1. Single shots protect all visible gap envelopes; quarter warnings last 2s and begin only with zero visible walls.

## Implementation

### I01. Laser geometry and clock
- Related files: `src/game/constants.js`, `src/game/boss-attacks.js` :: `isLaserPathSafe`, `findSafeLaserY`, `createSingleLaser`, `createQuarterLaser`, `updateLaser`, new `getLaserFrontX`; modify.
- Signatures: `findSafeLaserY({gaps?: Obstacle[], gapCenter?: number, gapHeight?: number, rng?: ()=>number, worldHeight?: number, playerHeight?: number, thickness?: number}): number|null`; `createSingleLaser(options): Laser|null`; `getLaserFrontX(laser, worldWidth=960): number`.
- Schema: Laser retains kind/y/safeZone/styleKey/thickness and remaining clocks, adds `telegraphDurationSeconds:number`, `activeElapsedSeconds:number=0`, `elapsedSeconds:number=0`, `fadeRemainingSeconds:number=0.15`. Constants quarter warning 2, sweep .4, fade .15.
- Merge forbidden Y intervals: each normal gap envelope from clamped base center +/- motion amplitude, gap half-height, beam half-height and player half-height. Sample complement uniformly, no center-gap fallback. Invalid geometry fails closed (null).
- Advance warning then active then fade with leftover delta, not lost frame time; warning/fade harmless. Shared front moves 960 to 0 during first .4 active seconds. Existing handcrafted snapshots without activeElapsedSeconds use full beam for compatibility.
- `src/game/collision.js::intersectsPlayerLaser`: guard clocks, check trimmed player front against shared front; quarter safe bounds must contain whole player hitbox.

### I02. Wave scheduling
- Related file: `src/game/game-engine.js` :: warningSession, startNextBossWallWaveIfNeeded, scheduleBossAttack, updateBossAttack; modify.
- Fields warningSession `laserPlan: undefined|null|'single'|'quarter'`, reset per wave; choice once when all wave walls spawned, existing boss2 unlock and 25% chance / 50% types.
- Single allowed when normal walls remain ahead, all special IDs resolved, at least one second since special/previous attack; pass all visible normal walls to safe Y selection. Keep current wave running; on completion set attack cooldown without resetting normal-wall count. No safe slot by wave completion: consume/skip and proceed to WASD.
- Quarter waits for waveComplete, normal-wall cooldown, special cooldown and empty obstacles. Pause spawning throughout warning/active/fade; then next wave and eventual WASD.
- Preserve WASD completion (3 successes), score behavior and no consecutive laser-only starvation.

### I03. Regression tests
- Related files: `tests/game/laser-safety.test.js`, `collision.test.js`, `game-engine.test.js`.
- Test inside-gap rejection, all-gap/moving-envelope safety, no safe slot returns null; independent 2s quarter/.7s single warning, delta overshoot, front reaches player before harm, harmless fade.
- Engine deterministic concurrent single with normal walls, quarter zero walls throughout attack, challenge follows laser; no fixed per-wave cap stalls.

## Acceptance Criteria
- [x] Single overlaps wall travel without covering any protected gap.
- [x] Quarter warning and firing have no visible walls.
- [x] No collision before the front reaches the player or during warning/fade.
- [x] WASD loop remains reachable.

## Validation
- `npm test -- --run tests/game/laser-safety.test.js tests/game/collision.test.js tests/game/game-engine.test.js`
- `npm run build`

## Commit Message
```text
fix(game): schedule safe concurrent and wall-free lasers

Plan: 2026-10-27-laser-light-integration
Phase: P01-lasers
Task: T01-safe-laser-engine

- Protect all moving gap envelopes and skip unsafe single shots
- Wait for all walls to leave before quarter attacks
- Match right-to-left collision timing to the light front
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- Validation: 60 tests across 3 files and production build passed. Twenty seeded boss encounters cleared without stalls.
- commit: see task commit

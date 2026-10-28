# Task: T02 Separate wall shots and wall-free volleys

## Status: done

## Goal
Each wall firing has one projectile; every completed wall group gets1..3 complete stage volleys with fresh warnings.

## Decision Summary
- D02/D03. Preserve wall firing opportunities and existing global-laser rules; no special-wall suppression.
- Source: .memory/decisions/2026-10-28-menu-music-manual-fire.md; no auth/database/deployment change.

## Implementation

### I01. Runtime contract
- Related Files: `src/game/boss-signatures.js` createSignatureAttack; `src/game/boss.js` encounter fields; `src/game/game-engine.js` beginWarningSession/startNextBossWallWaveIfNeeded/scheduleBossAttack/updateBossAttack; `tests/game/boss-signatures.test.js`; new `tests/integration/projectile-phases.test.js`.

#### Details
- **Signatures, Data & Schema Fields, Execution Flow**: Extend createSignatureAttack({...,projectileCount?:number}) so projectileCount:1 selects one actual existing stage trajectory before constructing it; preserve deterministic seed, full telegraph1.1s, speed220..360, stage style and offscreen collision semantics. Default retains stage3..5 shots. Encounter cyclePhase adds signature; signatureBudget:number1..3 and signaturesFired:number0, distinct from wall volleyBudget/volleysFired. Reset both per cycle. Wall opportunities use1 shot only while walls remain and existing3s pacing/budget. Once waveComplete and obstacles.length===0, enter signature, sample1..3 count once, pause walls and fire full volley. Next full volley begins only after prior attack resolved, at creation fresh1.1s warning; no extra rest. After final resolution call existing afterSignature -> global60%1..3 or live roar -> WASD. No stalls if wall-phase budget not exhausted when walls end. Full pending shots must leave viewport before next attack. Keep standard single/double laser safe-gap policy.
- **Validation and errors**: reject unavailable actions without consuming ready ammo or replaying later; validate finite deltas; guard null boss and restart lifecycle. Keep deterministic tests.
- **State Transition & Return**: public engine snapshot must represent real state with copied nested mutable data; final statuses match the contract above.

### I02. Behavior verification
- Related Files: test paths listed in I01; modify or new as specified.
- Stage default3..5 vs single1; all6 stages complete wall-free1/2/3 repeats; no walls overlap full volley; fresh telegraph every repeat and eventual challenge even when wall budget unspent.

## Acceptance Criteria
- [x] Observable goal and all approved timings/counts above implemented.
- [x] Specified validation passes without replacing meaningful adjacent guarantees.

## Validation
- `npm test -- --run tests/game/boss-signatures.test.js tests/integration/projectile-phases.test.js` ? expected successful exit; run individual commands sequentially when separated above.
- `git diff --check` ? no whitespace errors.

## Commit Message
```text
feat(game): projectile phases

Plan: 2026-10-28-menu-music-manual-fire
Phase: P01-runtime
Task: T02-projectile-phases

- Separate wall shots and wall-free volleys
- Validate approved behavior and preserve adjacent mechanics
```

## Progress
- [x] ?? ??
- [x] ?? ??
- commit: pending

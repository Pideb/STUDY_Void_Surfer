# Task: T04 Approved animated ink and glitch penalties

## Status: done

## Goal
Use approved ink-v3/glitch-v5 appearance for5s rather than static stripes/fullscreen blindness.

## Decision Summary
- D04, approved files in .memory/previews/2026-10-28-menu-music-manual-fire. Existing50/50 selection remains.
- Source: .memory/decisions/2026-10-28-menu-music-manual-fire.md; no auth/database/deployment change.

## Implementation

### I01. Runtime contract
- Related Files: `src/game/constants.js` CHALLENGE_FAILURE_EFFECT_SECONDS; new `src/game/challenge-effects.js`; `src/game/renderer.js` drawChallengeEffects; `tests/game/wasd-challenge.test.js`; new `tests/game/challenge-effects.test.js`.

#### Details
- **Signatures, Data & Schema Fields, Execution Flow**: Extract reusable drawChallengeFailure(ctx,effect,player,{reducedMotion?:boolean}) with elapsed age=durationSeconds-remainingSeconds; duration5, onset.11 and final1.2 fade. Copy selected four ink stains/drips/no global ink wash and clear ellipse74x52; glitch22Hz noise,19Hz broken bands, alpha .30 noise/.14 dark/.28..56 bands/.48 tear/.20 scans from penalty-v5.mjs. Keep deterministic seeded noise, cache offscreen noise canvas per renderer, no per-frame DOM accumulation. Handle canvas context mocks and no-document environments safely. Reduced motion retains obstruction intensity while limiting rapid animated static; no whole-screen white flashes. Existing essential cues remain drawn in established order, no gameplay collision modifications. Refresh same single failureEffect rather than stacking.
- **Validation and errors**: reject unavailable actions without consuming ready ammo or replaying later; validate finite deltas; guard null boss and restart lifecycle. Keep deterministic tests.
- **State Transition & Return**: public engine snapshot must represent real state with copied nested mutable data; final statuses match the contract above.

### I02. Behavior verification
- Related Files: test paths listed in I01; modify or new as specified.
- Effect expiry5s, ink/glitch deterministic geometry and changing noise, approved bounds/intensity constants, fade and no effect after expiry; renderer smoke passes.

## Acceptance Criteria
- [x] Observable goal and all approved timings/counts above implemented.
- [x] Specified validation passes without replacing meaningful adjacent guarantees.

## Validation
- `npm test -- --run tests/game/wasd-challenge.test.js tests/game/challenge-effects.test.js tests/game/renderer.test.js` - expected successful exit; run individual commands sequentially when separated above.
- `git diff --check` - no whitespace errors.

## Commit Message
```text
feat(game): failure effects

Plan: 2026-10-28-menu-music-manual-fire
Phase: P01-runtime
Task: T04-failure-effects

- Approved animated ink and glitch penalties
- Validate approved behavior and preserve adjacent mechanics
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: 811b81b

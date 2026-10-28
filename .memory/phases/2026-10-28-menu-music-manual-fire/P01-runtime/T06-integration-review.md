# Task: T06 Final regression and actual renderer evidence

## Status: done

## Goal
All tasks work together through boss clears/restarts and selected visuals/audio are shown in real runtime captures.

## Decision Summary
- Use completed task contracts and confirmed decisions, no deployment/DB expansion.
- Source: .memory/decisions/2026-10-28-menu-music-manual-fire.md; no auth/database/deployment change.

## Implementation

### I01. Runtime contract
- Related Files: Existing game/boss/UI/integration tests affected by removed automatic counterattack; new integration scenario helper; `.memory/validation/2026-10-28-menu-music-manual-fire/` evidence/report; README if controls documented.

#### Details
- **Signatures, Data & Schema Fields, Execution Flow**: Update legacy tests that assumed WASD damages/clears boss: fire through public engine API after10s active flight, assertHP only at laser impact. Preserve prior tests other guarantees rather than deleting them. Drive real engine multi-cycle1..3 signatures, challenges success/failure, paused clocks, manual3hits, transition/restart for all aircraft and deterministic6stage seeds; no unsafe mutation hooks added to production. Render actual menu/game/HUD gauge ready/charge/beam and penalty5s screenshots/animation on desktop and landscape mobile; use existing local Firefox rendering approach and preserve source/evidence. Verify full suite, production build and config. Record exact counts and any unvalidated manual physical-play limits. Mark plan/phase/current complete only after all checks pass; no Azure/Supabase actions.
- **Validation and errors**: reject unavailable actions without consuming ready ammo or replaying later; validate finite deltas; guard null boss and restart lifecycle. Keep deterministic tests.
- **State Transition & Return**: public engine snapshot must represent real state with copied nested mutable data; final statuses match the contract above.

### I02. Behavior verification
- Related Files: test paths listed in I01; modify or new as specified.
- All regression checks pass; actual renderer captures and reusable verification scripts show approved effects and controls; working tree committed, memory pointer complete.

## Acceptance Criteria
- [x] Observable goal and all approved timings/counts above implemented.
- [x] Specified validation passes without replacing meaningful adjacent guarantees.

## Validation
- `npm test -- --run; npm run build; npm run verify:config; git diff --check` - expected successful exit; run individual commands sequentially when separated above.
- `git diff --check` - no whitespace errors.

## Commit Message
```text
feat(validation): integration review

Plan: 2026-10-28-menu-music-manual-fire
Phase: P01-runtime
Task: T06-integration-review

- Final regression and actual renderer evidence
- Validate approved behavior and preserve adjacent mechanics
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

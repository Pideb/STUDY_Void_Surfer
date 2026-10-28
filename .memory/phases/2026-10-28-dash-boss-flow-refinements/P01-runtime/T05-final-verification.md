# Task: T05 Final Runtime Verification

## Status: done

## Goal
Prove all new behaviors work together through repeated encounters, render visible effects in a real browser, and complete the plan/current pointers with committed evidence.

## Decision Summary
- D01..D09 and the user's amended projectile-with-special-wall rule are authoritative. Keep prior account/aircraft/scoring/asset identities unchanged.

## Implementation
### I01. Integration and browser evidence
- Related Files: `tests/integration/dash-boss-flow.test.js` new, related existing tests only if affected; `.memory/validation/2026-10-28-dash-boss-flow-refinements/` new actual-runtime HTML/script/captures/report; `README.md`; plan/phase/tasks/current/decision status. Production fixes only for observed in-scope defects.
#### Details
- **Signatures & Types**: deterministic `createGameEngine({now,gravity:0,rng,stageRng,guestMode:true,invincibilityEnabled:true,aircraftId})` runner; renderer harness imports actual production loader/createRenderer, not preview draw code. No DB or login needed.
- **Data & Schema Fields**: evidence records D01..D09 coverage, seed/aircraft cases, actual barrier passage intervals, budget counts, roar movement/challenge freeze, no lingering projectile hit flags, renderer ring/debug/dualbeam/portal snapshots and command results.
- **Execution Flow / Logic**:
  1. Three aircraft at multiple progression levels through boss waves, failed challenge retry, multiple successes/clears/portals and restart. Prove volleys appear with special walls, every selected volley resolves offscreen,3HP clear and score+10 remain, spacing1.2 holds under fast/shift transitions and ordinary wall cadence remains.
  2. Run full Vitest once after integration, build and verify:config, whitespace. Fix real regressions then rerun relevant checks; final full rerun only when justified by new changes.
  3. Actual browser render ring partial/nearfull/ready, both laser lines in warning/firing, debug on/off, full-height fixed portal at ship high/low and DPR2/reduced fallback. Use temporary Firefox profiles outside the watched repository to avoid Windows Vite parent.lock failures. Save captures, describe deterministic rendering versus manual gameplay accurately.
  4. Update README actual rules and learning notes explaining timer clocks, immunity contact latches, spacing versus projectile scheduling, and renderer-only debug gating. Mark all tasks/phase/plan complete and current inactive; commit verification then pointer-sync docs. Do not claim live account or subjective balance validation.
- **Error & Exception Handling**: no hidden test skips or unhandled errors; finite attack completion, safe missing assets/reduced animation, old admin storage works. Do not expand scope on speculative concerns.

## Acceptance Criteria
- [x] All integrated behaviors and no-special-projectile-gate verified for three aircraft without stalls.
- [x] Full test/build/config pass and actual renderer evidence recorded.
- [x] All task commits and memory pointers finalized; working tree clean.

## Validation
- `npx vitest run`
- `npm run build`
- `npm run verify:config`
- `git diff --check`

## Evidence
- 41 files / 556 tests passed; production build/config and whitespace passed.
- See [verification report](../../../validation/2026-10-28-dash-boss-flow-refinements/report.md) for decision coverage and actual renderer captures.
- 18 new multi-aircraft integration scenarios completed 36 bosses and 36 portals; retained six-stage regression also passed.

## Commit Message
```text
test(game): verify dash recovery and distributed boss combat

Plan: 2026-10-28-dash-boss-flow-refinements
Phase: P01-runtime
Task: T05-final-verification

- Validate repeated encounters, barrier spacing and input lifecycle
- Record actual renderer evidence and updated gameplay rules
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: 407ee14

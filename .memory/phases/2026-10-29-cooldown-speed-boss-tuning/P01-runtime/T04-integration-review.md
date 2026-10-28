# Task: T04 Integration Review

## Status: pending

## Goal
Finish all confirmed tuning with regression, build/config checks and actual renderer evidence; close memory pointer accurately.

## Decision Summary
- Run the complete existing suite once all targeted changes pass. Fix only regressions caused by these decisions.
- Capture actual production renderer/engine, not the design-only preview, and document fixture limitations.

## Implementation
### I01. Documentation and real-screen evidence
- Related Files: `README.md` gameplay rules — modify; `.memory/validation/2026-10-29-cooldown-speed-boss-tuning/` — new review/evidence; existing test files affected by approved changes — modify as needed.
- README: fixed+10 per10 andcap100 allcraft; ordinary240->340 /480->580; current boss factors; smallring; .5charge+.2recovery; wall-free3..6 pervolley, repetition1..3; line15%.
- Evidence should include allthree actual ships with cooldownmarker, real manual firing charge/beam states, wall-free6-shot example, and15% line placement. Capture desktop andlandscape-mobile viewport scaling; do not change production auth/state for capture.
- Use production createRenderer/drawDashCooldown/drawManualLaser, actual assetloader and publicengine or explicitly labeled deterministic geometry for reproducible captures. Browser-only candidate code is not production evidence.
- `report.md` records literal observed speeds, timings/counts/margins, fullsuite result, build/config and any playtest limitations. Keep preview-only scripts under.memory.
- No new persistent schema or external network mutations. Visual choices already approved; do not ask another design question.

### I02. Final verification / pointer closure
- Run fullsuite; inspect and correct failures caused by speed, firing, signature count or edge-margin changes; do not weaken tests by removing safety assertions.
- Run build thenverify:config sequentially; whitespace checks.
- MarkT04 done, commit, updatephase4/4,plan done,current noactive,decision implementedwithreportlink. Commit finalpointer sync separately so last task hash is recorded.

## Acceptance Criteria
- [ ] All tests/build/config passed with results recorded.
- [ ] Actual renderer evidence supports marker/firing/projectile/laser changes and mobile scaling.
- [ ] README and memory match final runtime; clean git tree after final sync.

## Validation
- `npm test -- --run` — all test files pass.
- `npm run build` — pass.
- `npm run verify:config` — pass after build.
- `git diff --check` — clean.

## Commit Message
```text
test(game): verify cooldown speed and boss tuning end to end

Plan: 2026-10-29-cooldown-speed-boss-tuning
Phase: P01-runtime
Task: T04-integration-review

- Record actual renderer evidence and complete gameplay regressions
- Synchronize documented rules with the approved runtime tuning
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

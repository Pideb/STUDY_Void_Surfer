# Task: T06 Integration and Actual Runtime Evidence

## Status: done

## Goal
Prove all approved changes in complete actual encounters/real renderer, finish regressions/build/config and close memory accurately.

## Implementation
### I01. Actual implementation verification
- Related Files: `README.md` gameplay docs — modify; `.memory/validation/2026-10-29-boss-motion-aim-patterns/` report/capture scripts/images/QA — new; existing affected tests — modify only for approved semantics/regressions.
- Capture actual production engine/renderer/HUD states: drained dark intro foreground, all-six motion extrema/actions, aimed hit/miss and one-time lethal AEGIS,80px reactor PC/landscape, global warning/active markings without text, WASD keys/time without headings, passed band stability.
- Fixtures may disable gravity/collision for reproducibility but must be labeled; geometry/flow tests run actual public APIs with aiming where needed. Do not substitute preview-only render code.
- README records caps200/actual440,440,680,8s/min4, live motion/aimed firing, shuffled rounds/global inclusion and text cleanup.
- Exercise complete6-stage progression for all craft, challenge failure/retry, firing during hazards, restart/pause and snapshot mutation safety. Preserve scoring/guest/admin behavior.
- No new persistent data or external mutation. Record any material manual-playtest limits honestly.

### I02. Completion sync
- Run complete suite once targeted tests pass; fix approved-change regressions, not unrelated refactors. Build THEN verify:config (dist-dependent), whitespace checks.
- MarkT06 done/commit, advancephase6/6,plan done,current no active. Final sync commit records final task hash and updates decisions/review status to implemented with report link.

## Acceptance Criteria
- [x] Full suite/build/config pass; actual runtime visual evidence reviewed.
- [x] All13 decisions covered and final working tree clean.

## Validation
- `npm test -- --run`
- `npm run build`
- `npm run verify:config` (after build)
- `git diff --check`

## Commit Message
```text
test(game): validate moving boss combat and shuffled encounters end to end

Plan: 2026-10-29-boss-motion-aim-patterns
Phase: P01-runtime
Task: T06-integration-evidence

- Verify full encounter progression and actual production screens
- Synchronize final gameplay rules and completion evidence
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

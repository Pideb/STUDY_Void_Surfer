# Task: T05 Full regression and actual visual verification

## Status: pending

## Goal
Full regression and actual visual verification with observable behavior defined below.

## Decision Summary
- All confirmed geometry, timing, caps, AEGIS damage, lasers and viewport clarity work together.
- Source: .memory/decisions/2026-10-28-central-hitbox.md. Preserve other existing behavior.

## Implementation

### I01. Production contract
- Related Files (modify/new/read-only as stated): Existing affected runtime/UI/integration tests, README; .memory/validation/2026-10-28-central-hitbox/ scripts/captures/report; plan/phase/current dashboards.

#### Details
- **Signatures, schema fields and flow**: Run full suite and adjust old-fixture assumptions only where requirements changed: boundaries16, nose8, damage3AEGIS, caps70/100 and new laser safe interior. Preserve unrelated assertions and actual sweep checks; no production test hooks. Real runtime across3craft/sixstages: rays only insideallowedregion, large success box does not cause death, Spacecooldown.7/dash.6/mandatoryresponse1.2 remain, AEGIS1shot retains3HPUI, othercraft3shots, reward/portal/restart. Actual headlessFirefox captures with production renderer/HUD at1920x1080 and640x360/DPR2,4K or capped case; inspect aircraft/beam/background not enlarged world, boundsdebug16 only adminoption. Before/after same logical scene may render legacy960buffer through preview-only offscreen transform, never mutate production for reference. Record buffer vsCSS dimensions, assetsloaded/failures, aspectratio/overflow and selected geometry. Add reusable review HTML and compare PNGs. Validation commands sequential: fulltests, build, config(after build), whitespace. Document subjective real-device FPS/touch limits honestly. Complete memory after task commit; no push/deploy/auth/DB changes.
- **Validation & errors**: reject invalid/non-finite coordinates/times without granting success; unavailable actions do not consume resources. Handle missing scene/context layouts safely. No backend/schema dependency.
- **State/return**: public snapshots remain detached; operations reflect real state without mutation hooks; visual and actual geometry agree.

### I02. Verification
- Related Files: associated existing tests listed above; new test paths are explicit.
- Exercise exact boundaries and changed behavior plus existing adjacent regressions. Do not silently delete meaningful checks.

## Acceptance Criteria
- [ ] Production behavior matches all stated values/edge cases.
- [ ] Specified validation passes.

## Validation
- `npm test -- --run; npm run build; npm run verify:config; git diff --check` - each command must succeed; semicolon-separated commands run sequentially.
- `git diff --check`

## Commit Message
```text
feat(game): integration review

Plan: 2026-10-28-central-hitbox
Phase: P01-runtime
Task: T05-integration-review

- Full regression and actual visual verification
- Validate approved mechanics and preserve adjacent guarantees
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

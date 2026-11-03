# T02 deploy and proof

## Status: done

## Results
- Preparation3b80a57cc0f7ecc547a9f0fe015d227765773cf8: Actions41556010277 success00:55:01Z; live JS SHA2563c96ee6db5e29966863413b13c49f8e5bcbe2abd7a3e23ef739098fcbf9fa754 matches local.
- Canonical record-deployment succeeded; docs converged/checked and0.2b snapshot protected. Metadata commitd59b5734637b3afa7b26bd90a389e748e847dd39 pushed.
- Exact metadata follow-up Actions41556504860 success00:59:25Z; re-downloaded live JS has same hash, guide exact match, old guide entries and protected snapshots unchanged. No gameplay/audio changes after preparation.
- Closure commit is memory/evidence-only [skip ci]; no runtime/official document modifications or extra deploy required. All requested work complete.

## Goal / Decision Summary
Deploy prepared0.2b and prove exact runtime/guide bytes. Existing user authorization includes push and metadata follow-up; no additional confirmation.

## Implementation
- `git push origin main` normal fast-forward only; exact HEAD push Actions REST inspect current run/jobs until completed. On failure inspect actual logs and fix only cause, never claim queued or old success as this deployment.
- Diagnostic `.memory/validation/2026-11-03-v02b-production-release/verify-deployment.mjs`: download current public origin index/JS/guide after Actions success; compare JS SHA256 with local dist, guide normalized bytes with generated guide, v0.2b header and ordered old v0.2 entry/exact bullets. Assert emitted runtime version0.2b and renamed ranking reload marker. Save real headSha/runId/runUrl/conclusion/completedAtUtc/gameFingerprint/version/bundleSha256/origin proof. Record old snapshots SHA before and after.
- `npm run release:record-deployment -- --proof <proof>`; then docs:build once more to converge management output after snapshot protection, docs:check. README and memory status record verified deployment. Commit/push only evidence/docs metadata; follow-up exact HEAD Actions and live JS unchanged verification, no proof recursion. Runtime registry projection ensures metadata-only commit leaves JS unchanged.
- Snapshot0.2b protected after success; do not alter0.2 or older. Final public game/guide links.
- After the metadata follow-up actually succeeds, close memory status in a separate memory/evidence-only commit using `[skip ci]`; do not recursively deploy another record of the verification. This final commit must touch no game, guide, build config or official docs. Normal workflow validation remains mandatory on deployment commits.

## Acceptance Criteria
- [x] Exact pushed HEAD Actions success and real public JS/guide match.
- [x] Deployment record/docs committed and metadata follow-up pushed/verified.

## Validation
Read-only public ranking endpoint success; immutable snapshots; proof CLI + docs:check; metadata Actions success and unchanged live JS.

## Commit Message
```text
release: record verified v0.2b Azure deployment

Plan: 2026-11-03-v02b-production-release
Phase: P01-release
Task: T02-deploy-and-proof
```

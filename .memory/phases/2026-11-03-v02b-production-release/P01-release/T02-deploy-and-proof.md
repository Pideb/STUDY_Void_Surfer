# T02 deploy and proof

## Status: pending

## Goal / Decision Summary
Deploy prepared0.2b and prove exact runtime/guide bytes. Existing user authorization includes push and metadata follow-up; no additional confirmation.

## Implementation
- `git push origin main` normal fast-forward only; exact HEAD push Actions REST inspect current run/jobs until completed. On failure inspect actual logs and fix only cause, never claim queued or old success as this deployment.
- Diagnostic `.memory/validation/2026-11-03-v02b-production-release/verify-deployment.mjs`: download current public origin index/JS/guide after Actions success; compare JS SHA256 with local dist, guide normalized bytes with generated guide, v0.2b header and ordered old v0.2 entry/exact bullets. Assert emitted runtime version0.2b and renamed ranking reload marker. Save real headSha/runId/runUrl/conclusion/completedAtUtc/gameFingerprint/version/bundleSha256/origin proof. Record old snapshots SHA before and after.
- `npm run release:record-deployment -- --proof <proof>`; then docs:build once more to converge management output after snapshot protection, docs:check. README and memory status record verified deployment. Commit/push only evidence/docs metadata; follow-up exact HEAD Actions and live JS unchanged verification, no proof recursion. Runtime registry projection ensures metadata-only commit leaves JS unchanged.
- Snapshot0.2b protected after success; do not alter0.2 or older. Final public game/guide links.

## Acceptance Criteria
- [ ] Exact pushed HEAD Actions success and real public JS/guide match.
- [ ] Deployment record/docs committed and metadata follow-up pushed/verified.

## Validation
Read-only public ranking endpoint success; immutable snapshots; proof CLI + docs:check; metadata Actions success and unchanged live JS.

## Commit Message
```text
release: record verified v0.2b Azure deployment

Plan: 2026-11-03-v02b-production-release
Phase: P01-release
Task: T02-deploy-and-proof
```

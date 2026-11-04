# Task: T02 deploy and verify v0.2d

## Status: pending

## Goal
Publish0.2d and record fresh exact-HEAD workflow success plus matching operating JS/CSS/guide evidence.

## Decision Summary
- Explicit deployment authorization includes main push and recording verification metadata.
- No force push, no fabricated/reused evidence and no unrelated remote writes.

## Implementation
### I01. Push and verify
- Files: new task-owned check-run.mjs, verify-deployment.mjs and proof/report JSON under `.memory/validation/2026-11-04-v02d-production-release/`; docs registry/generated outputs/README; AGENTS operating-current/next example; memory pointers.
- Check remote main ancestry via git fetch/merge-base; reconcile non-destructively if remote advanced, rerun necessary validation on changed source. Push prepared commit on main normally.
- Connector fetch_commit_workflow_runs is PR-only; use GitHub public REST `/repos/Pideb/STUDY_Void_Surfer/actions/runs?branch=main&event=push&head_sha=<exact40sha>` for Azure push discovery. Select matching head_sha and azure workflow path. Poll no more than30s per wait and communicate at least each60s. Save compact id/status/conclusion/HEAD/url/timestamps, don't expose credentials.
- After exact run completes success, fetch live origin https://proud-grass-03a132e00.6.azurestaticapps.net with cache-busting HEAD query. Extract JS/CSS from HTML; require same filenames and SHA256 bytes as post-preparation dist build. Require guide bytes match local normalized output and parsed update entries match exact newest two bullets plus all previous entries.
- Proof schema {version:'0.2d',gameFingerprint:string,headSha:40hex,runId:integer,runUrl:string,conclusion:'success',completedAtUtc:ISO,bundleSha256:64hex,origin:string}; only after verifying all above write deployment-proof.json and detailed deployment-verification.json. Read requests only to production.
### I02. Record and close
- Execute `npm run release:record-deployment -- --proof .memory/validation/2026-11-04-v02d-production-release/deployment-proof.json`; run docs:check and guide:check. This protects the new0.2d snapshot. Update README/AGENTS operating release statements with actual run link and next0.2e, not historical evidence.
- Commit metadata/docs and push. Runtime imports registry so build again, wait for the metadata HEAD's own Actions success and compare its live bytes. Save metadata-proof.json/metadata-verification.json without repeatedly invoking record-deployment (would create a proof/bundle recursion). Registry primary proof remains valid historical first deployment; report secondary latest proof explicitly.
- Only after both checks complete close task/phase/current and commit final memory evidence with [skip ci]; push docs-only closure so no new operating-bundle claim is implied. All game source, authored notes, release identity and proof unchanged by closure. Report live link and actual deployment state.

## Acceptance Criteria
- [ ] Exact prepared HEAD workflow succeeded and operating JS/CSS/guide match local bytes.
- [ ] Primary proof recorded, new snapshot protected, metadata HEAD also verified.
- [ ] All source changes committed/pushed and memory closed; unrelated untracked artifacts untouched.

## Validation
- `node <task-dir>/check-run.mjs <HEAD>`; `node <task-dir>/verify-deployment.mjs <HEAD> deployment|metadata`.
- `npm run release:record-deployment -- --proof <task-dir>/deployment-proof.json`; `npm run docs:check`; `npm run guide:check`; `npm run build`; `git diff --check`.

## Commit Message
```text
docs(release): record verified v0.2d deployment

Plan: 2026-11-04-v02d-production-release
Phase: P01-release
Task: T02-deploy-verify
```

## Progress
- [ ] Deployment verified
- [ ] Metadata deployment verified
- commit: pending

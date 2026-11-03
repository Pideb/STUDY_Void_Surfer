# Task: T02 Publish and verify v0.2c

## Status: done

## Goal
Exact prepared commit deployed to Azure and evidence-backed release state recorded.

## Decision Summary
- User authorizes push/deploy now. Success requires exact HEAD workflow and actual production bytes, not elapsed time or previous run.

## Implementation
### I01. Push and observe
- Related Files: .memory/validation/2026-11-03-v02c-production-release scripts/evidence/report new; existing workflow read-only; release registry/docs generated.
#### Details
- Inspect git ls-remote/main and ancestor relationship; push main normally, no force/reset. Local ahead commits include approved aircraft rank/popup implementation. New production commit HEAD must be saved before push; no intermediate local commit during exact-HEAD proof verification.
- GitHub connector only lists PR-triggered commit runs, so push-run discovery may use public GitHub REST `actions/runs?branch=main&event=push&head_sha=<HEAD>`; use connector job/step tools once run ID known. Require run.head_sha exact, status completed, conclusion success; retain runId/html_url/completion metadata. Poll in <=60sec intervals with progress updates. Failed CI: inspect concrete job logs; fix only necessary issue, rerun preparation if game fingerprint changes.
### I02. Production checks and record
- Signature evidence `{version:'0.2c',gameFingerprint:string64,headSha:string40,runId:number,runUrl:string,conclusion:'success',completedAtUtc:string,bundleSha256:string64,origin:'https://proud-grass-03a132e00.6.azurestaticapps.net'}`.
- GET cache-busted index, JS and CSS; require URLs and SHA256 equal current prepared dist. GET guide exact LF-normalized match public/guide/index.html; parse latest v0.2c single bullet exact and preserve prior entries. Check emitted JS contains latest popup version/text and aircraft RPC symbols. No login/game-score writes.
- Once verified save proof JSON and run `npm run release:record-deployment -- --proof .memory/validation/2026-11-03-v02c-production-release/deployment-proof.json`. It validates current HEAD/ancestry/fingerprint, then protects new snapshot. Run docs/guide checks and update docs/management/README.md current version/run link and manual-guide preservation statement; keep historical proof files intact.
- Commit evidence/docs using below message, push. That metadata push may trigger another workflow; verify same bundle/guide if needed, never relabel the first deployed HEAD as the later one. Final memory-only closure can use [skip ci] with no game/doc source changes. Report actual deployed version/url and honest private-write verification limits.

## Acceptance Criteria
- [x] Exact pushed HEAD7435c06 workflow41590988690 succeeded; production JS/CSS/guide match validated source.
- [x]0.2c deployed-verified recorded with new proof and protected snapshot; documentation/evidence commit and push follow this task completion.
- [x] No unrelated changes, remote SQL writes or lost historical release/update entries.

## Validation
- Public Actions exact-HEAD success and SHA256 verification script.
- `npm run release:record-deployment -- --proof .memory/validation/2026-11-03-v02c-production-release/deployment-proof.json`
- `npm run docs:check`
- `npm run guide:check`
- `git status --short --untracked-files=no`

## Commit Message
```text
docs(release): record verified v0.2c Azure deployment

Plan: 2026-11-03-v02c-production-release
Phase: P01-release
Task: T02-deploy-verify
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: recorded in git history (T02-deploy-verify)

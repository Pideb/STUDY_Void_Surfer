# Task: T03 Future Release Sync and Final QA

## Status: done

## Implementation
- New `scripts/release-docs.mjs`: CLI for `build`, `check`, `prepare` and `record-deployment`. Fingerprint sorted src/public/index/lockfile and relevant package dependencies/engines (not doc script names). Docs-only rebuild/check does not bump. Changed game `prepare --title ... --change ...` runs tests/build/config, appends next version once (b→c throughz→nextminor), records exact source fingerprint/validation and pending status, generates management HTML plus latest/new version presentation. `--dry-run` is read-only. Failure leaves previous release catalog/files unchanged using prepare-after-validation staging/atomic writes or rollback for target files.
- No fabricated patch notes: explicit --change entries plus Git subjects/files as source context; labels remain reviewed changes. Incomplete validation does not getpassed status. Same fingerprint+same catalog repeated prepare is idempotent. Protect original0.01v/b snapshots; on newversion create void-surfer-{version}.html, preserve older files. Current presentation alias uses approved b presentation skeleton/assets/story, updates current rules/version/release/metadata source fields from catalog, with historical feedback labelled as history, not substituted versions everywhere. Current build creates latest alias without overwriting b.
- `record-deployment` requires a proof file for matching release fingerprint + successful workflow head/run URL + observed bundle hash; updates only current catalog status then rebuilds both artifacts. It never mutates service credentials/DB or auto-pushes. Existing verified b evidence can seed initial deployed status. Do not let old proof promote new code.
- `npm` scripts `docs:build`, `docs:check`, `release:prepare`, `release:record-deployment`; GitHub Actions predeploy executes docs:check so changed game can't publish stale docs. No CI self-commit loop. AGENTS.md and docs/releases/README document required future release flow (agent invokes prepare before deployment; after verified deployment records proof and pushes docs). Future version bump automatic within prep; initial management draft stays0.01-b.
- Tests `tests/docs/release-docs.test.js` exercise version rollover/idempotent no-bump/docs check stale fingerprint/failed preparation no writes/proof mismatch. Temp files constrained to owned temp dirs; no destructive cleanup without verifying workspace/temp prefix. No network mutation in tests.
- Build management/current presentation, check relevant script tests; npm build+verify:config because package/workflow changed, no fullgame suite repeat unless source changed (futureprepare runsfull). Native browser QA and source/asset/hash/no-secret checks, final report under `.memory/validation/2026-10-30-management-console/`, local task commits and memory complete. No push or Azure deployment now. Auto-open management HTML and link it; user will request refinements.

## Acceptance Criteria
- [x] One version/catalog generates both documents; CI checks stale docs; version bumps idempotent and proof fields/head/source checked. Actual service confirmation remains the deploying agent's responsibility.
- [x] Edge375/768/1440, themes/offline/print/sliders/export and latest presentation pass;2files13tests/build/config pass, snapshots intact. Report records evidence. Local commits only, no push.

## Commit Message
```text
build(release): synchronize management and presentation documentation

Plan: 2026-10-30-management-console
Phase: P01-console
Task: T03-release-sync
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit:pending

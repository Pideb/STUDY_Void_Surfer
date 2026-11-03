# T01 version and guide

## Status: done

## Results
1,405 tests/85 files passed; build/config/docs/guide checks passed. Prepared current/development0.2b, base0.2, next0.21. Old guide objects identical and protected snapshot hashes identical to baseline. Chromium production preview menu reads v0.2b; guide at1200/375px shows new2 bullets above old7, headings36/32px weight800, no overflow. Read-only public ranking200/10 rows. Audio source unchanged.

## Goal / Decision Summary
Prepare canonical0.2b under explicit user instruction, retain base0.2/next0.21, unchanged audio and historical guide entries. No gameplay rebalance.

## Implementation
- `scripts/release-core.mjs` nextVersion(version,base): recognize explicit base+single lowercase suffix (0.2b) and return base+'1'. Existing numeric sequence and invalid/base validation unchanged.
- `scripts/release-docs.mjs` prepare/CLI: optional string `options.version` / `--version`; only accept the normal next version or base+[a-z], reject malformed/foreign base/existing protected or historical duplicate. Apply override consistently to dry-run and real prepare; unchanged pending retry with same version is idempotent, mismatched requested pending version errors instead of silently preparing the wrong one. Version selection validation precedes full checks/writes. Preserve transactional writes and source gate.
- `docs/player/updates.json`: unshift `{version:'v0.2b',title:'v0.2b',date:'2026-11-03',body:['플레이어가 보스 공격시 피격 판정 개선','GUEST 랭킹 불러오기 이슈 수정']}`; old entries remain byte-equivalent as parsed objects. No replacement/automatic added copy.
- `tests/docs/release-docs.test.js`: named next-version/default continuation, explicit preparation/dry-run/idempotency/reject duplicate and invalid override; existing numeric tests. `tests/docs/player-guide.test.js`: select historical v0.2 by heading, assert new first entry exact bullets and preserved old entries/order; source test compares old objects to committed baseline.
- `AGENTS.md`, `docs/management/README.md`, registry.policy: record explicit one-off0.2b and next0.21 without raising base. CurrentVersion/developmentVersion only set by release:prepare, not manual bypass.
- `npm run release:prepare -- --new-release --version 0.2b --title ... --change ...` performs full suite/build/config and all official docs+snapshot generation; docs/guide checks, then rebuild with prepared runtime registry. Read-only DB public ranking probe, immutable snapshots check, browser menu/guide headings/order verification. No new DB migration.

## Models
Registry currentVersion/developmentVersion:string0.2b, versionBase:string0.2, nextVersion:string0.21. Existing release schemas remain, no secret fields introduced. options.version optional string from explicit CLI only.

## Acceptance Criteria
- [x] All prior guide entries identical and below new2-bullet entry.
- [x] Main/guide/docs canonical0.2b, future0.21 and protected snapshots unchanged.
- [x] Full suite/build/config/docs checks pass; audio source unchanged.

## Validation
`npm test -- --run tests/docs/release-docs.test.js tests/docs/player-guide.test.js`
Full release:prepare, `npm run build`, `npm run verify:config`, `npm run docs:check`, `npm run guide:check`.

## Commit Message
```text
release: prepare v0.2b with preserved player guide history

Plan: 2026-11-03-v02b-production-release
Phase: P01-release
Task: T01-version-and-guide
```

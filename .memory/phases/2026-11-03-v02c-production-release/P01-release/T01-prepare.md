# Task: T01 Prepare v0.2c

## Status: done

## Goal
Validated v0.2c release artifacts and user-authored guide note ready to push.

## Decision Summary
- Explicit0.2c, base0.2 unchanged, next0.21. No production success claim before T02.

## Implementation
### I01. Guide and release preparation
- Related Files: docs/player/updates.json modify; scripts/release-docs.mjs read-only; docs/management/releases.json and generated game-data/management HTML, docs/releases/latest/version snapshot/versions.json, public/guide/index.html generated.
#### Details
- Prepend `{version:'v0.2c',date:'2026-11-03',title:'v0.2c',body:['기체별 랭킹 세부화']}`; retain previous entries unchanged.
- Save baseline previous entries and protected snapshot hashes in .memory/validation/2026-11-03-v02c-production-release/baseline.json. No environment secrets.
- Run `npm run release:prepare -- --new-release --version 0.2c --title "기체별 랭킹 세부화 및 시작 업데이트 안내" --change "종합 및 기체별 랭킹 분리와 비공개 플레이 점수 저장" --change "최신 플레이가이드 업데이트 내역 시작 팝업"`. Script synchronizes guide then validates entire suite/build/config and updates currentVersion/developmentVersion, fingerprint and both docs. Do not invoke docs:build instead of release preparation.
- Check docs/guide consistency, exact latest bullet, previous entries preserved, current/development0.2c/base0.2/next0.21, pending status, old snapshot hashes unchanged. Capture build JS/CSS SHA256 after rebuilding prepared registry because embedded runtime version changes. No arbitrary release ID reuse.
- Relevant tests only if preparation identifies stale hardcoded fixture; no gameplay changes. Leave unknown/untracked preview artifacts unstaged.

## Acceptance Criteria
- [x] Full release validation passed,0.2c pending, exact guide note and older entries intact.
- [x] Docs/guide checks pass; protected snapshots unchanged.

## Validation
- `npm run release:prepare -- --new-release --version 0.2c --title "기체별 랭킹 세부화 및 시작 업데이트 안내" --change "종합 및 기체별 랭킹 분리와 비공개 플레이 점수 저장" --change "최신 플레이가이드 업데이트 내역 시작 팝업"`
- `npm run docs:check`
- `npm run guide:check`
- `npm run build` then `npm run verify:config`

## Commit Message
```text
chore(release): prepare v0.2c aircraft rankings and startup updates

Plan: 2026-11-03-v02c-production-release
Phase: P01-release
Task: T01-prepare
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: recorded in git history (T01-prepare); 1,421 tests passed

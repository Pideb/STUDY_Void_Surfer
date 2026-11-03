# Decisions: v0.2c production release

- User explicitly authorizes deployment as v0.2c; use --version0.2c, keep versionBase0.2 and next default0.21.
- Prepend player guide entry version/title v0.2c, date2026-11-03, exact sole bullet: 기체별 랭킹 세부화. Preserve prior entries byte-for-byte in meaning/order. Startup popup consumes the same latest entry.
- Deploy committed aircraft rankings/private run scores and startup popup through existing main-branch Azure workflow. Public migration reads were verified; do not rerun SQL or write synthetic scores.
- Release preparation must run full tests/build/config, synchronize management/presentation/guide and protect old snapshots. Commit/push only relevant files; unrelated untracked previews remain local.
- Mark deployed only after exact pushed HEAD Actions success, production JS/CSS SHA256 equality and guide content verification. Record proof with release:record-deployment, then commit/push evidence and docs. No balance/audio changes.

# Task: T01 Catalog and Lab Model

## Status: done

## Goal
Produce authoritative current configuration and shared tunable simulation math without changing the game.

## Implementation
- New `scripts/game-catalog.mjs`: `collectGameCatalog():object` imports actual constants/aircraft/difficulty/player/geometry/stages/boss/weapon/asset modules; returns schemaVersion1, constants, aircraft with actual gravity/lift/base/ceiling/boss targets, stage data, geometry, mechanics, unlocks and source refs. Current engine-only probabilities/order documented with exact source references; avoid treating legacy reflection/WARNING as active.
- New `docs/management/lab-model.mjs`: pure exported functions with var/function declarations, no DOM/import side effects. `targetSpeed(config,craft,progression,mode)`, `specialEligibility(config,{playerX,wallX,speed,windowSeconds,hitbox,successWidth})`, `timingSpan(...)`, `simulateFlight({gravity,lift,interval,duration,step})`. Match actual defaults; allow hypothetical overrides. True early-contact and collision cutoff, not a center shortcut; invalid values return safe result. Hitbox16, success56×36, separate hybrid small-box gap check.
- New `docs/management/releases.json`: currentVersion0.01-b, version policy, baseline app fingerprint, releases entries for0.01v and0.01-b with honest source/date/deployment/changes/validation. Preserve chronological b follow-ups (boss/menu, cadence, FHD/startup) without inventing separate deployed versions. Planned next0.01-c explicitly marked not deployed.
- New cache/data writer under scripts or docs/management: collect current manifest URLs; keyed source SHA and dataURI. Seed existing optimized presentation cache `LOCALAPPDATA/Temp/void-surfer-release-001-assets`; no old builder rerun. Fallback original file bytes when cache source changes. Onlypublic artwork, never.env/credentials.
- New targeted `tests/docs/management-model.test.js`: parity against actual getBaseSpeed/aircraft multipliers, isSpecialTimingSuccess over boundaries/speeds, gravity/lift discrete updates; version increment helper tested later. Do not mirror DOM implementation tests.

## Acceptance Criteria
- [x] Actual module values and source refs captured; preview math matches production defaults/boundaries.
- [x] Release history accurate and original presentation hashes intact; assets derived from actual files.

## Validation
- `npm test -- --run tests/docs/management-model.test.js`; source snapshot generation; `git diff --check`.

## Commit Message
```text
docs(management): derive the game catalog and tunable simulation model

Plan: 2026-10-30-management-console
Phase: P01-console
Task: T01-catalog-model
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit:pending

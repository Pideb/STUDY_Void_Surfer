# Task: T04 Alphabetic versions, synchronized references and final validation

## Status: done

## Goal
Alphabetic versions, synchronized references and final validation, according to confirmed decisions for 2026-11-04-v02d-gameplay-balance. Finish independently verifiable behavior before advancing.

## Decision Summary
- Scope, numbers and constraints are fixed below. Preserve existing unrelated behavior.
- No deployment; changes require sequential scoped commits and memory pointer updates.

## Implementation

### I01. Production integration
- Related Files:
- scripts/release-core.mjs :: nextVersion.
- scripts/release-docs.mjs :: explicit version validation.
- docs/management/releases.json :: policy,nextVersion,developmentVersion only; keep currentVersion0.2c and original gameFingerprint/proofs.
- scripts/game-catalog.mjs :: craft recharge, wall tiers, line timing, recovery, unique frequency descriptions.
- scripts/build-management.mjs :: localGameFingerprint:string, localChanges:boolean, developmentVersion:string, clearly separate local reference rules from operating proof; modify.
- scripts/build-presentation.mjs; docs/management/browser.js/content.html; docs/management/README.md; docs/player/guide-content.json.
- tests/docs/release-docs.test.js tests/docs/management-model.test.js tests/docs/player-guide.test.js tests/lib/release-version.test.js and affected assertions.
- Generated docs from npm run docs:build (including public guide). .memory/validation/2026-11-04-v02d-gameplay-balance/report.md (new).
- AGENTS.md already changed in interview; include policy and decisions in scoped commits.

#### Details
nextVersion(version:string,baseVersion='0.1'):string uses base -> base+'b', letters incrementc,d...z->aa (finite alphabetic continuation; never auto-change base). Historic0.01v/0.01-b map tobase; numeric suffix IDs remain historical readable but are not automatic outputs; reject unsupported base. Explicit overrides must not rewind existing alpha version or reuse protected IDs, including multi-letter suffix. Tests preserve pending idempotence, dry-run no writes and transaction rollback.
Set nextVersion0.2d, developmentVersion0.2d; preserve operating currentVersion0.2c, fingerprints, proof entries and snapshot hashes. No release:prepare/no new release entry/no push. Local display v0.2d development.
Document current local rules accurately: AEGIS30s,3HP/onehit; others10s;0.3s immediate-input recovery; new bosswall rows; unique1or2 nonconsecutive; line warning.7/active.2/fade.1, random heights with25%clear and horizontal slots. Keep all historical player-authored updates unchanged; update control guide wording for charging difference only.
Existing docs:check intentionally rejects modified game fingerprint until user requests release preparation. Do not weaken this production gate, overwrite old fingerprint or fake deployment evidence. Run docs:build and compare canonical documentOutputs files exactly in a standalone node verification; run docs:check and record expected source-staleness separately from actual failures. Generated latest/management must explicitly distinguish current local rules from verified operating0.2c; preserve protected snapshot bytes. No need new rollout feature.
Run whole test suite,build,verify:config,guide:check,document output equality,git diff --check once after final fixes. Record real test counts, limitations: local automated coverage vs physical fullscreen/mobile/live-account testing; no externalDB modification. Close task/phase/current with commits, retain unrelated untracked previews.

### I02. Verification
Add/update meaningful behavior tests for the specified edge cases. No test-only changes to production cadence. Fix regressions caused by these exact behavior changes; report other findings separately.

## Acceptance Criteria
- [x] All specified user-visible behaviors implemented.
- [x] Targeted commands pass; no protected deployment history altered.
- [x] Task status/progress and current pointer synchronized after commit.

## Validation
- `npm test -- --run; npm run build; npm run verify:config; npm run guide:check; npm run docs:build; npm run docs:check (expected source fingerprint gate, document separately); git diff --check`

## Commit Message
```text
chore(release): use alphabetic patches and synchronize balance references

Plan: 2026-11-04-v02d-gameplay-balance
Phase: P01-gameplay-balance
Task: T04-version-docs-validation

- Implement confirmed behavior and validate regression boundaries
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- Validation: 1443 tests/88 files; build/config/guide passed; canonical7 outputs and5 protected snapshots verified. docs:check retains expected production source-change gate. Commit: containing task commit.
- commit: 9b32cce

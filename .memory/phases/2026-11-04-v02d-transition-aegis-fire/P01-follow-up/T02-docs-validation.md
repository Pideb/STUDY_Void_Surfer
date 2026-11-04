# Task: T02 references and final validation

## Status: done

## Goal
Local game descriptions and HTML references accurately describe no extra transition walls and craft-specific firing time, while preserving operating0.2c history and local0.2d.

## Decision Summary
- No new release entry/version bump/deployment. Do not run release:prepare or change original deployed fingerprint.
- Preserve player-authored docs/player/updates.json, all SQL and protected snapshots.

## Implementation

### I01. Reference synchronization
- Related Files: `scripts/game-catalog.mjs`, `scripts/build-presentation.mjs`, `docs/management/browser.js`, `docs/management/README.md`, `docs/player/guide-content.json`, `src/ui/app-controller.js` (AEGIS description), `src/ui/screens.js` only if relevant; modify.
- Catalog weapon adds timingByAircraft:Record<string,{windupSeconds:number,activeSeconds:number,lockedSeconds:number}> from createBossWeapon. Keep existing top-level standard timing fields for normal-craft compatibility. bossCadence adds postClearExtraWalls:number=0; excludeTransitionWalls remains true for archived metadata compatibility.
- Remove present-tense two-extra-wall descriptions; explain existing-wall drain followed by portal. Explain AEGIS1s wind-up/.2s beam/1.2s lock vs others.5/.2/.7,30s recharge unchanged. No fake user-authored update notes.
- Generate with guide:build then docs:build so local catalog fingerprint includes current public guide. Compare documentOutputs() equality and protectSnapshots(). Source fingerprint docs:check must still reject until actual requested deployment; record this explicitly as expected release gate, never bypass it.

### I02. Regression closure
- Related tests: `tests/docs/management-model.test.js`, `tests/ui/app-controller.test.js` affected description and other directly affected tests. Add assertions comparing timings to actual craft weapons and postClearExtraWalls0.
- Run full suite, build, config, guide and diff checks. Report actual counts and limits in `.memory/validation/2026-11-04-v02d-transition-aegis-fire/report.md`; save test JSON there.
- Synchronize task/phase/current and commit. Existing prior untracked previews remain untouched. No external service writes or measured-device performance claims.

## Acceptance Criteria
- [x] All current documentation reflects both changes and authored update history is preserved.
- [x] Full tests/build/config/guide pass; generated reference equality and snapshot protection pass.
- [x] Operating history/fingerprint/versions preserved and no deployment.

## Validation
- `npm run guide:build`; `npm run docs:build`; `npm test -- --run`; `npm run build`; `npm run verify:config`; `npm run guide:check`; `npm run docs:check` (expected source gate); `git diff --check`.

## Commit Message
```text
docs(game): synchronize transition and AEGIS firing references

Plan: 2026-11-04-v02d-transition-aegis-fire
Phase: P01-follow-up
Task: T02-docs-validation
```

## Progress
- [x] Implementation complete
- [x] Validation passed:1450 tests in89 files, build/config/guide/canonical outputs/snapshots. docs:check expected pre-release source gate retained.
- commit: containing task commit

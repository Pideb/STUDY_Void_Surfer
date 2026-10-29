# Task: T04 Boss Re-entry After the Next Stage

## Status: done

## Goal
After each boss, finish the portal and allow15..20 additional score points of normal play before the next boss. Keep first20 and old WARNING design separate.

## Decision Summary
- D05 supersedes D01's subsequent5..8 interval. Baseline is full portal completion score, including prior clear reward and any pause deduction during transition.
- Keep absolute current-score thresholds, no reroll on pause and no speed reduction. No deployment, DB or balance changes.

## Implementation

### I01 Independent cadence and completion hook
- `src/game/constants.js`: add `BOSS_REENTRY_SCORE_MIN:number=15`, `BOSS_REENTRY_SCORE_MAX:number=20`. Preserve WARNING_SCORE_STEP5/8 for archived chooser.
- `src/game/difficulty.js`: new `chooseBossReentryScoreStep(rng:()=>number=Math.random):number`, existing clamped roll; uniform inclusive15..20. Keep `chooseWarningScoreStep` unchanged.
- `src/game/game-engine.js`: import new chooser. In `completeBossIfReady():void`, keep actual clear count/+10/advanceStage but remove next threshold selection. In `updateStage(deltaSeconds:number,scrollSpeed:number):void`, when `stageTransition.phase==='complete'`, select `nextWarningScore=getScore()+chooseBossReentryScoreStep(rng)` exactly once, then clear transition. Stage-swap alone must not arm it.
- In `getTargetDifficulty()` no-session path, suppress threshold with MAX_SAFE_INTEGER while `pendingStageAdvance||stageTransition||bossEntry||bossPreview` so old threshold does not classify post-clear flight as another boss or alter speed before the next normal segment.
- Existing numeric `nextWarningScore` and snapshot `difficulty.nextWarningScore` retained. No new persisted fields or auth/schema changes. start() resets to first20 or existing explicit test-fixture override.

### I02 Regression checks
- `tests/game/difficulty.test.js`: new chooser endpoints0→15, .5→18,1→20; preserve old5/8 tests.
- `tests/integration/boss-only-loop.test.js`: actual two-boss flight, noWARNING, initial20. Record full portal completion score, assert selected threshold equals that baseline+15..20, no boss before it. Parameterize minimum/maximum RNG boundaries if deterministic flight allows. Pause once during first portal to prove selection occurs after transition; no boss during pending/swap/portal, one schedule only, no pause reroll afterward. Preserve real boss wall no-score/count/unlock checks. start() resets20.
- Run affected integration/game engine/difficulty/portal tests, then full suite once; build and verify config sequentially.

### I03 Version material
- `README.md`, `docs/releases/README.md`: first20; subsequent15..20 from completed next stage. Archived WARNING5..8 remains historical.
- `.memory/validation/2026-10-29-001b-boss-menu/build-release.py`: current rules/first feedback use new cadence, add follow-up note to version changes without changing4 original requirement count/25 feedback cards. Runtime commit is known follow-up parentT03 until final commit hash is available; use source revision wording `T04 follow-up on 3928989` and metadata `sourceRevisionNote` to avoid claiming new runtime equals oldcommit. Update test count from actual final suite.
- Rebuild only0.01-b, history metadata and Downloads copy. Keep0.01v immutable. Update HTML QA expected test count/revision-copy check as needed. Add follow-up evidence to report and separate full-log instead of relabelling old716 results. Preserve earlier captures as earlier0.01-b evidence; no new first-menu claims.

## Acceptance Criteria
- [x] First20 and repeated15..20 after full transition verified; reward10 and transition pause cannot consume new interval.
- [x] WARNING archive unchanged, new normal segment not classified asboss; pause no reroll/restart reset.
- [x] Current HTML/history/docs updated, old0.01v intact; tests/build/config pass, local commits only.

## Validation
- `npm test -- --run tests/game/difficulty.test.js tests/game/game-engine.test.js tests/integration/boss-only-loop.test.js tests/integration/boss-entry.test.js tests/game/portal-transition.test.js`
- `npm test -- --run`, `npm run build`, `npm run verify:config`
- New HTML audit/responsive harness in existing validation folder; `git diff --check`.

## Commit Message
```text
fix(game): schedule the next boss after 15 to 20 stage points

Plan: 2026-10-29-001b-boss-menu
Phase: P01-runtime
Task: T04-boss-reentry-cadence

- Start the next boss interval only after the portal completes
- Preserve archived WARNING cadence and update 0.01-b evidence
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit:e0eaacf

## Evidence
- Related5 files92 tests; full57 files718 tests passed. Build/config passed.
- Native HTML1440/768/375, copy (T04 revision), cadence text, print/filter/tab/offline passed. No missing embedded images or browser exceptions; old0.01v SHA preserved and Downloads equal.
- See validation `report.md` T04 section, `t04-full-tests.log`, `verification.json`, `asset-audit.json`. No push or deployment.

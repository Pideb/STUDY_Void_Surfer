# Task: T01 Score Pacing and VELOCITY Final Score

## Status: done

## Goal
Replace elapsed-time difficulty escalation with score-progress pacing and make VELOCITY award a rounded 1.5x final score end-to-end. Pausing subtracts 10 from run score but must not reduce progression score or base speed already earned.

## Decision Summary
- Unmultiplied progression advances with earned score (ordinary passed obstacle = 1 point; boss-clear bonus remains +10 progression points); every 10 progression points increases base speed by 10%: `240 * 1.1 ** floor(progressionScore / 10)`.
- VELOCITY keeps 2x movement/half spawn interval but uses `Math.round(baseRunScore * 1.5)` only at run end. The final integer is used in result, submission, account-best updates, and unlocks.

## Implementation

### I01. Separate run score from monotonic progression and use progress-based speed
- Related Files:
  - `src/game/constants.js` :: speed-step constants; replace elapsed-time step with a score-step of 10; keep the 1.1 speed factor.
  - `src/game/difficulty.js` :: `getBaseSpeed`, `getDifficulty`; compute base speed from unmultiplied progression, not elapsed time. Preserve elapsed seconds for boss SHIFT timing and snapshot metadata.
  - `src/game/score.js` :: `advanceScore`; preserve unique obstacle de-duplication and safe integer behavior; update score-session progression bookkeeping as needed.
  - `src/game/game-engine.js` :: score session, `getScore`, `getCurrentDifficulty`, `startWarningIfNeeded`, `processPassedObstacles`, `completeBossIfReady`, `pause`, `start`, `getSnapshot`; maintain `{ score, progressionScore, passedObstacleIds }`.
  - `tests/game/score.test.js`, `tests/game/difficulty.test.js`, `tests/game/game-engine.test.js` :: update elapsed-time expectations and cover monotonic progression/pause behavior.

#### Details
- `scoreSession.score`: integer run score before aircraft multiplier; pause may reduce it by 10, minimum zero.
- `scoreSession.progressionScore`: integer, unmultiplied and monotonic during a run; increments exactly once per passed obstacle and by 10 on boss clear; pause never changes it; reset on `start()`.
- Preserve `passedObstacleIds: Set<string>` and current de-duplication semantics.
- `getBaseSpeed(progressionScore)` uses `step = floor(max(0, trunc(progressionScore)) / 10)` and returns `BASE_SCROLL_SPEED * SPEED_STEP_MULTIPLIER ** step`.
- Extend `getDifficulty` inputs so progression score is separate from elapsed seconds. Continue to use elapsed seconds for boss SHIFT pattern speed changes and report it in difficulty snapshots.
- On each unique wall pass, add exactly 1 to run score and progression (no per-aircraft score multiplier during the run). On boss clear, preserve +10 bonus and add +10 progression.
- `getCurrentDifficulty()` uses progression score for base speed; apply existing BOSS and aircraft speed multipliers afterward.
- `pause()` subtracts 10 from run score only. Resume and repeated pause preserve progression and current speed; restart resets both counters.
- Keep existing initial score dependencies deterministic; initialize progression from the nonnegative initial unmultiplied score.

#### T01 Validation Cases
- Progress 0/9 -> speed 240; 10 -> 264; 20 -> 290.4.
- Duplicate obstacle ID increments neither score nor progression twice.
- Boss clear adds +10 to run score and progression once.
- At progress >=10, pause may reduce run score while `progressionScore` and `difficulty.baseSpeed` remain unchanged; score clamps at zero.
- Restart resets counters and speed step to configured initial progress.

### I02. Compute and submit final VELOCITY score; expose score breakdown
- Related Files:
  - `src/game/aircraft.js` :: default and VELOCITY definitions; display default as `NOVA` without changing ID `default`; set VELOCITY `scoreMultiplier` to 1.5; retain unlock/movement values.
  - `src/game/constants.js` :: `VELOCITY_SCORE_MULTIPLIER = 1.5`.
  - `src/game/game-engine.js` :: `getSnapshot`; expose `baseScore`, `finalScore`, and `scoreMultiplier`; `finalScore = Math.round(score * multiplier)`; keep live score integer/base.
  - `src/ui/app-controller.js` :: `loadGameOverData`, game-over paint model; submit `snapshot.finalScore`, pass score breakdown, validate response against submitted final integer, preserve retry/update behavior.
  - `src/ui/screens.js` :: `renderGameOverScreen`; for VELOCITY show `기본 점수 N × 1.5 = 최종 점수 M`; other aircraft show the existing simple result.
  - `src/ui/app-controller.js` :: `getHangarAircraft`; update VELOCITY score stat to x1.5 final and AEGIS lift stat to 60%.
  - `tests/game/aircraft.test.js`, `tests/game/game-engine.test.js`, `tests/ui/app-controller.test.js`, `tests/ui/screens.test.js` :: test final-score math and end-to-end submission.

#### Details
- Snapshot: `score: number` remains current raw run score; `baseScore: number` is end-of-run raw score; `scoreMultiplier: number` is selected aircraft multiplier; `finalScore: integer` is `Math.round(baseScore * scoreMultiplier)`.
- `loadGameOverData()` uses `finalScore` with fallback to `score` for legacy/injected snapshots; call `submitBestScore(user, { score: finalScore, displayName, aircraftId })` exactly once for the game-over request.
- Validate returned `record.bestScore >= finalScore`; never send fractional score to the service. The resulting account best is the final score, and existing aircraft unlock thresholds continue to compare against it.
- Rounding checks: base 21 -> 32, 33 -> 50, zero -> zero for 1.5 multiplier.
- Preserve failed-submit messaging, retry behavior, and leaderboard loading.

## Acceptance Criteria
- [x] Base speed rises 10% per 10 monotonic unmultiplied progression points, not elapsed time.
- [x] Pause reduces run score only and never lowers attained speed.
- [x] VELOCITY game-over score is rounded 1.5x, with the requested arithmetic displayed.
- [x] Final integer is the score submitted and used for account best/unlock decisions.
- [x] Default craft is NOVA while its stored ID remains `default`.

## Validation
- `npm test -- --run tests/game/score.test.js tests/game/difficulty.test.js tests/game/game-engine.test.js tests/game/aircraft.test.js tests/ui/app-controller.test.js tests/ui/screens.test.js`
- `git diff --check`

## Commit Message
```text
feat(score): use progress-based pacing and final VELOCITY score

Plan: 2026-09-28-aircraft-visibility-score-pacing
Phase: P01-gameplay-and-aircraft
Task: T01-score-pacing

- Drive speed from monotonic unmultiplied progression points
- Submit and display rounded 1.5x VELOCITY final score
```

## Progress
- [x] Implementation complete
- [x] Validation passed: focused 6-file suite (68 tests), `git diff --check`
- commit: `feat(score): use progress-based pacing and final VELOCITY score`

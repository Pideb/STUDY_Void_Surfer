# Task: T01 Freeze Aircraft Per Run

## Status: done

## Goal
Guarantee the aircraft chosen before a game starts remains unchanged during PLAYING and PAUSED, even if authentication/session events toggle guest mode. Preserve account unlock enforcement between runs.

## Decision Summary
- Freeze both guest/account eligibility mode and aircraft selection for the duration of a run.
- The controller already applies the current auth mode, best score, and selected aircraft in `beginPlaying()` before `gameEngine.start()`; this remains the only synchronization boundary.

## Implementation

### I01. Enforce the run configuration invariant
- Related Files:
  - `src/game/game-engine.js` :: `setGuestMode`; modify
  - `tests/game/game-engine.test.js` :: guest/account mode and aircraft transition regression tests; modify

#### Details
- **Existing contracts**:
  - `setAircraft(id)` returns `false` while state is `GAME_STATES.PLAYING` or `GAME_STATES.PAUSED`.
  - `setAccountBestScore(bestScore)` already returns the current score without mutation while PLAYING or PAUSED.
  - `beginPlaying()` in `src/ui/app-controller.js` calls `setGuestMode`, `setInvincibilityEnabled`, `setAccountBestScore`, `setAircraft`, then `start`.
- **Required behavior**:
  1. In `setGuestMode(enabled)`, if state is PLAYING or PAUSED, do not mutate `guestMode`, `aircraft`, or unlock state; return the current `guestMode` unchanged.
  2. Outside an active run, preserve current behavior: update `guestMode`; when switching to account mode, reset an aircraft that is locked under current `accountBestScore` to DEFAULT.
  3. Do not modify `setAircraft`, `setAccountBestScore`, selection UI, unlock thresholds, or scoring.
- **Tests**:
  - In guest mode, select VELOCITY (all craft are guest-unlocked), start, then call `setGuestMode(false)`. It must report the frozen guest mode, and `getSnapshot().aircraft.id` must remain `velocity`.
  - While active, a call to `setAircraft('default')` must still return false and leave VELOCITY unchanged.
  - Pause the run and repeat the guest-mode change; the active mode and craft must remain frozen.
  - Outside a run, switching to account mode with insufficient `accountBestScore` must still restore DEFAULT, and locked selection must still be rejected.
  - Cover the inverse active transition (account to guest) to ensure mode is not changed mid-run either.

### I02. Focused validation
- Run the exact test command below; fix any regression before marking this Task done.

## Acceptance Criteria
- [x] Guest/account mode changes cannot change the active run's aircraft or eligibility mode.
- [x] Aircraft selection remains immutable during PLAYING and PAUSED.
- [x] Existing between-run account unlock and guest all-aircraft behavior remains unchanged.
- [x] Focused engine and controller tests pass.

## Validation
- `npm test -- --run tests/game/game-engine.test.js`

## Commit Message
```text
fix(game): lock aircraft selection for each run

Plan: 2026-10-21-aircraft-run-lock
Phase: P01-runtime-lock
Task: T01-freeze-aircraft-per-run

- Ignore auth-mode changes during active gameplay
- Preserve the run aircraft until the next start boundary
- Cover guest and account transitions during play and pause
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

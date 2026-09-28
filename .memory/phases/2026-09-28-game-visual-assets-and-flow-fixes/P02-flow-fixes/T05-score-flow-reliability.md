# Task: T05 Score Flow Reliability

## Status: pending

## Goal

Make the account best score visible and accurate in the hangar, and make game-over score submission complete once before leaderboard reads with a clear retry path if the write fails.

## Implementation

### I01. Account score state

- Related Files:
  - `src/ui/app-controller.js` :: `state`, `loadAccountBestScore`, `OPEN_HANGAR`, and menu/hangar paint flow.
  - `src/ui/screens.js` :: `renderHangarScreen`; show loading state separately from a real zero score and preserve error status.
  - `tests/ui/app-controller.test.js`; `tests/ui/screens.test.js` :: delayed-fetch and error-state coverage.

#### Details

- Refresh the score when entering the hangar, ignore stale requests by request ID, repaint on success, and show `불러오는 중` while pending.
- Do not unlock aircraft from a temporary zero while the request is pending.

### I02. Game-over submission lifecycle

- Related Files:
  - `src/ui/app-controller.js` :: `loadGameOverData`; add one in-flight guard/status and submit-before-fetch sequencing.
  - `src/ui/screens.js` and `src/ui/leaderboard-view.js` :: show saving/error state and make retry call submission again only when the previous write failed.
  - `tests/ui/app-controller.test.js`; `tests/integration/leaderboard-failure.test.js`; `tests/integration/game-flow.test.js` :: assert one submit per game-over flow, submit-before-read order, and failed-write retry.

#### Details

- On first game over, call `submitBestScore` once with the final score, display name, and aircraft ID.
- After the write resolves, fetch top and neighborhood rows; if the write fails, keep leaderboard rendering and expose a retry action that retries the write.
- Do not submit again merely because a leaderboard read failed.

## Acceptance Criteria

- [ ] Hangar shows the fetched account best score and does not flash a misleading zero while pending.
- [ ] Score writes occur once per game-over entry and precede leaderboard reads.
- [ ] A failed score write can be retried from the result screen without duplicating successful writes.

## Validation

- `npm run test -- --run tests/ui/app-controller.test.js tests/ui/screens.test.js tests/integration/leaderboard-failure.test.js tests/integration/game-flow.test.js`

## Commit Message

```text
fix(account): stabilize best-score and game-over submission flows

Plan: 2026-09-28-game-visual-assets-and-flow-fixes
Phase: P02-flow-fixes
Task: T05-score-flow-reliability

- show account best-score loading and refresh states
- retry failed score writes without duplicating successful submissions
```

## Progress

- [ ] Implementation complete
- [ ] Validation passed
- commit: pending

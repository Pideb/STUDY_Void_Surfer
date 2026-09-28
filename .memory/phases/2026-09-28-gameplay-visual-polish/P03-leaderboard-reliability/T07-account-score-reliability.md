# Task: T07 Account Score Reliability

## Status: done

## Goal
Diagnose and fix the reported hangar account-best-score lookup and game-over score-save failures. Ensure the client reports real backend success/failure, retries only the failed score submission, and does not silently claim that an unsaved result was registered.

## Decision Summary
- Supabase remains the authoritative account record; do not replace it with local storage or infer success from a resolved promise alone.
- Existing app flow calls `get_player_best_score` when opening the hangar and `submit_score` on game over. Inspect actual error/result payloads and the two migrations before changing behavior.
- No remote migrations or production database writes are part of this Task. If the deployed schema is missing a required migration, report the exact operator action separately.

## Implementation

### I01. Trace and harden RPC result handling
- Related Files:
  - `src/services/leaderboard-service.js` :: `fetchPlayerBestScore`, `submitBestScore`; modify only when a reproduced client/result-handling defect is found.
  - `src/services/leaderboard-errors.js` :: `mapLeaderboardError` and missing-RPC recognition; read/modify if needed.
  - `src/ui/app-controller.js` :: `loadAccountBestScore`, `loadGameOverData`, `OPEN_HANGAR`, `retryLeaderboard`; modify.
  - `src/main.js` :: leaderboard service bindings; read/modify only if binding omission or incorrect client routing is identified.
  - `supabase/migrations/202609210001_void_surfer_leaderboard.sql`, `supabase/migrations/202609230001_aircraft_scores.sql`; read-only schema/RPC contract source.
  - `tests/services/leaderboard-service.test.js`, `tests/ui/app-controller.test.js`, `tests/integration/leaderboard-failure.test.js`; modify.

#### Details
- **RPC contracts to verify**:
  - `get_player_best_score()` returns one nullable row with `best_score` numeric for the authenticated user; service normalization returns `{ bestScore: integer >= 0, error: null }` or a typed error.
  - New score write is `submit_score(p_score integer, p_display_name text, p_aircraft_id text)`; legacy two-argument fallback is allowed only for a missing-signature error already recognized by the service.
  - A successful write response must normalize to a valid score record. Do not turn malformed/null write data into success.
- Trace the user path from `OPEN_HANGAR` through `loadAccountBestScore` and from `finishGame()` through `loadGameOverData` to the RPC. Determine the issue using tests/mocks and code/migration comparison; do not print `.env` values or auth tokens.
- Preserve stale-response guards. Ensure failed or stale hangar requests cannot overwrite a newer account's score or unlock selection. Ensure a failed game-over score submission sets visible error state and a retry re-submits the score once; leaderboard read retry alone must not duplicate an already successful write.
- Verify game-over UI only announces account registration after a valid success response. Lower-than-personal-best submissions may be valid non-updates and should still display the authoritative returned best score/rank state accurately.
- If code is correct but deployed behavior requires an unapplied migration, do not mutate Supabase. Surface the missing RPC/schema condition clearly and report which migration the project operator must apply.
- Tests cover: score RPC scalar/object/one-row responses; malformed response; missing RPC signature fallback; auth/network error not retried via legacy signature; hangar request success/error and stale response; immediate game-over submit exactly once; failed submit retry exactly once; leaderboard-query retry without re-submit.

## Acceptance Criteria
- [x] Hangar receives the authenticated account best score or clearly shows the lookup error; no stale account result is applied.
- [x] Game-over performs one account score submission and presents success only for a valid successful RPC result.
- [x] Failed writes can be retried once per explicit retry; leaderboard-only refresh does not re-submit a successful score.
- [x] Legacy RPC fallback is restricted to missing-signature errors.
- [x] No remote Supabase mutation or secret output occurs.

## Validation
- `npm test -- --run tests/services/leaderboard-service.test.js tests/ui/app-controller.test.js tests/integration/leaderboard-failure.test.js` — all 40 tests pass.
- `npm run build` — production build passes.

## Commit Message
```text
fix(leaderboard): make account score read and write states reliable

Plan: 2026-09-28-gameplay-visual-polish
Phase: P03-leaderboard-reliability
Task: T07-account-score-reliability

- Harden account best-score loading and stale response handling
- Verify score submission success, errors, and explicit retry behavior
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

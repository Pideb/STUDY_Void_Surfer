# Task: T02 Guest Record and Aircraft Access

## Status: done

## Goal
Keep guest best score on the current browser, never submit it to the account leaderboard, and allow guest players to select every aircraft regardless of account unlock thresholds.

## Decision Summary
- Store a versioned local guest record containing best final score and aircraft ID; do not migrate it into an account on sign-in.
- All catalog aircraft are unlocked for a guest; authenticated unlock thresholds remain unchanged.

## Implementation

### I01. Guest-local record service and state integration
- Related Files:
  - `src/services/guest-record-service.js` :: `readGuestRecord`, `writeGuestRecord`; new
  - `src/ui/app-controller.js` :: state initialization, menu/hangar/game-over models, `loadGameOverData`, `handleSignIn`, `handleSignOut`; modify
  - `src/game/game-engine.js` :: guest aircraft access setting and `setAircraft`; modify
  - `tests/services/guest-record-service.test.js` :: new
  - `tests/ui/app-controller.test.js` :: guest record and submit separation; modify

#### Details
- **Storage key and schema**: Use `void-surfer:guest-record:v1` in `window.localStorage`. JSON shape: `{ "version": 1, "bestScore": integer >= 0, "aircraftId": "default" | "velocity" | "aegis", "achievedAt": ISO-8601 string }`.
- **Function signatures**:
  ```js
  readGuestRecord(storage = globalThis.localStorage) -> { bestScore: number, aircraftId: string, achievedAt: string | null }
  writeGuestRecord(record, storage = globalThis.localStorage) -> { bestScore: number, aircraftId: string, achievedAt: string } | null
  ```
- **Validation**: Reject malformed JSON, unsupported version, invalid score, aircraft, or timestamp and return a zero/default record. Catch unavailable/throwing storage and preserve playable flow. Only replace stored data when `finalScore` is strictly greater than the existing local best; retain aircraft and timestamp associated with that best.
- **Controller fields**: Add `state.guestBestRecord` and a guest-aware hangar model. On guest boot, load local record. When authenticated, continue using `accountBestScore` and do not merge local record. Switching auth identity only switches which record/unlock rules are presented.
- **Submission guard**: On game over, guest record is saved locally and `leaderboardService.submitBestScore` is never called. Authenticated runs keep existing server submission behavior. Retry after a failed signed-in submission remains signed-in-only.
- **Hangar**: For guests, each catalog item's `unlocked` is true and the personal best display uses `guestBestRecord.bestScore`; for signed-in users use the account best score. Add explicit `gameEngine.setGuestMode(true|false)` rather than faking an infinite account score; enforce it in `setAircraft` and game-start initialization, then reset it correctly on auth changes.
- **Guest account transition**: Sign-in after guest play retains the guest record separately for a future guest session but does not display it as account best, submit it, or auto-transfer it.

### I02. Guest score and unlock tests
- Related Files:
  - `tests/services/guest-record-service.test.js` :: schema, invalid data, storage exceptions, best-record ordering; new
  - `tests/game/game-engine.test.js` :: guest aircraft acceptance while preserving account locks; modify
  - `tests/ui/app-controller.test.js` :: guest game-over writes local record and skips RPC; modify
  - `tests/ui/screens.test.js` :: guest aircraft and best-score display; modify

#### Details
- Verify guest can choose NOVA, VELOCITY, and AEGIS at score zero; account mode still obeys current unlock thresholds.
- Verify a lower guest score never overwrites the local best, a higher score stores its aircraft, and invalid/unavailable storage does not block game-over UI.
- Verify guest result updates the local record but calls no account write endpoint and sign-in does not submit the prior guest score.

## Acceptance Criteria
- [ ] Guest best final score persists across reloads in versioned local storage.
- [ ] All aircraft are usable in guest mode; signed-in unlock rules are unchanged.
- [ ] Guest scores never call score-write RPCs and never auto-transfer after sign-in.
- [ ] Storage failures and corrupted data safely fall back without blocking play.

## Validation
- `npm test -- --run tests/services/guest-record-service.test.js tests/game/game-engine.test.js tests/ui/app-controller.test.js tests/ui/screens.test.js`

## Commit Message
```text
feat(game): persist guest best score and unlock aircraft

Plan: 2026-09-30-pilot-ranking-admin-guest
Phase: P01-guest-mode
Task: T02-guest-record-and-aircraft

- Store guest best record locally without account submission
- Unlock all aircraft for guests only
- Keep guest and account records separate
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending

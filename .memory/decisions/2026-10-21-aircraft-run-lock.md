# Decisions: Aircraft Run Lock

- Date: 2026-10-21
- Status: Confirmed

## D01. Freeze the selected aircraft for the whole run
- **Chosen**: The aircraft selected immediately before a run remains active through PLAYING and PAUSED; session/auth changes cannot replace it mid-run. Apply account/guest eligibility changes only between runs.
- **Rationale**: Game-engine code already rejects `setAircraft` while active and defers account best-score updates, but `setGuestMode` still changes aircraft during a run. A late auth/session callback can therefore replace a guest-unlocked aircraft with DEFAULT, causing the reported intermittent change.

## D02. Keep auth changes for the next run
- **Chosen**: While playing or paused, `setGuestMode` returns the current run's guest/account mode without changing either it or the aircraft. The controller reconfigures the mode at the next `beginPlaying()`.
- **Rationale**: `beginPlaying()` already synchronizes guest mode, account best score, and selected aircraft before `gameEngine.start()`, providing a safe run boundary without changing selection UI or unlock rules.

## D03. Regression coverage
- **Chosen**: Add engine tests for guest-to-account and account-to-guest changes during PLAYING/PAUSED, asserting both mode and aircraft remain frozen and aircraft switching stays rejected.
- **Rationale**: This isolates the race-prone engine invariant in deterministic tests and protects restarts from regression.

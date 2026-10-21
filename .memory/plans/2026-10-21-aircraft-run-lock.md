# Plan: Aircraft Run Lock

## Goal
Prevent late authentication/session changes from replacing the chosen aircraft during an active game, while preserving aircraft unlock rules at the next run boundary.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Freeze aircraft and guest/account mode during a run, with regression tests | [P01](../phases/2026-10-21-aircraft-run-lock/P01-runtime-lock/phase.md) |

## Completion
- The run's aircraft and guest/account eligibility mode remain fixed until the run ends.
- Validation passed with `npm test -- --run tests/game/game-engine.test.js tests/ui/app-controller.test.js` (68 tests).

## Confirmed Decisions
- [Decision record](../decisions/2026-10-21-aircraft-run-lock.md)
- `setGuestMode` must not mutate the current run while PLAYING or PAUSED.
- At the next run start, the controller continues to synchronize auth mode, best score, and selected aircraft before starting the engine.

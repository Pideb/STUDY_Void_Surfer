# Plan: Aircraft rankings and private play scores

## Goal
Implement approved overall/NOVA/AEGIS/VELOCITY tabs, readable on mobile landscape, with independent aircraft bests and private final scores for each run. Preserve old records, deployed RPCs and overall-only game-over.

## Inputs
- [Decisions](../decisions/2026-11-03-aircraft-rankings-play-history.md)
- [Approved menu](../validation/2026-11-03-aircraft-ranking-menu/preview.html)

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | done | Schema, services, UI and local validation; rollout separate | [P01](../phases/2026-11-03-aircraft-rankings-play-history/P01-rankings/phase.md) |

## Scope
Implement/test/commit sequentially. No remote SQL, push, deployment, version bump, audio/balance changes. Preserve unknown legacy scores as NULL.

## Result
All three implementation tasks committed. [Validation report](../validation/2026-11-03-aircraft-rankings/report.md) records 1,415 passing tests, local SQL/build/config checks, pre-final mobile browser evidence and final-spacing screenshot limitation. Release docs gate remains pending a future release; apply the new SQL before deploying the client.

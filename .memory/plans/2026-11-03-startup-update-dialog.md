# Plan: Startup update dialog and migration check

## Goal
Apply approved startup popup using the same source as the latest guide entry, and independently verify public aircraft-ranking RPCs in Supabase without changing real data.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | done | Startup popup implemented and public Supabase RPCs verified | [P01](../phases/2026-11-03-startup-update-dialog/P01-startup/phase.md) |

## Scope
[Decisions](../decisions/2026-11-03-startup-update-dialog.md). Implement/test/commit. No remote writes, push, release preparation or deployment. Do not edit historical guide entries or release snapshots.

## Result
Implementation e79a85f,1,421 tests passed, build/config/guide checks passed. [Report](../validation/2026-11-03-startup-update-dialog/report.md) includes actual PC/mobile screenshots and remote read-only evidence. Release docs source-fingerprint gate remains until next deployment request. Authenticated score/history writes were not remotely tested.

# Plan: Startup update dialog and migration check

## Goal
Apply approved startup popup using the same source as the latest guide entry, and independently verify public aircraft-ranking RPCs in Supabase without changing real data.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | in_progress | One integrated startup-modal task and read-only SQL evidence | [P01](../phases/2026-11-03-startup-update-dialog/P01-startup/phase.md) |

## Scope
[Decisions](../decisions/2026-11-03-startup-update-dialog.md). Implement/test/commit. No remote writes, push, release preparation or deployment. Do not edit historical guide entries or release snapshots.

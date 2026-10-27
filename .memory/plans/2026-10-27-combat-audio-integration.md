# Plan: Combat and Audio Integration

## Goal
Apply approved HP countdown, hybrid wall, visible shock-ring dash, smooth background transition with spawn suspension, twelve stage/boss tracks, entrance siren and right-edge boss arrival.

## Decisions
[Approved review](../decisions/2026-10-27-combat-visual-audio-polish.md). Laser light integration is already complete and must not regress.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | in_progress | Engine/render/audio changes with regression coverage | [P01](../phases/2026-10-27-combat-audio-integration/P01-combat-audio/phase.md) |

## Task Rationale
Four independent validated commits: presentation/entry state, hybrid geometry, background travel/spawn lifecycle, then audio assets and playback lifecycle. Each keeps a runnable game. Preserve approved preview files and account/database configuration.

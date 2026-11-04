# Plan: v0.2d transition and AEGIS firing follow-up

## Goal
Remove the two post-boss new walls, drain existing walls before the portal, and extend only AEGIS firing to1s preparation+0.2s emission. Preserve recharge30s, one-hit damage, recovery and normal craft timings.

## Decisions
[Confirmed interview](../decisions/2026-11-04-v02d-transition-aegis-fire.md).

## Phases
| Phase | Status | Summary | Blueprint |
| --- | --- | --- | --- |
| P01 | in_progress | Gameplay and synchronized local references | [P01](../phases/2026-11-04-v02d-transition-aegis-fire/P01-follow-up/phase.md) |

## Scope
Two sequential tasks: core behavior with targeted tests, then reference synchronization and full validation. No push, new release preparation, DB writes or production version promotion. Preserve historical authored updates and protected snapshots.

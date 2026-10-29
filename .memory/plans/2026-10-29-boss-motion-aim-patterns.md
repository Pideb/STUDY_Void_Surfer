# Plan: Boss Motion, Aiming and Random Patterns

## Goal
Implement all13 [confirmed decisions](../decisions/2026-10-29-boss-motion-aim-patterns.md), including passed guide stability, drained/dark boss entry, shared live boss motion and projectile paths, aimed manual beam, shuffled patterns, reactor HUD, WASD/global-laser tuning and approved text cleanup.

## Phases
| Phase | Status | Summary | Blueprint |
| --- | --- | --- | --- |
| P01 | in_progress | Existing game runtime, HUD and full regression | [P01](../phases/2026-10-29-boss-motion-aim-patterns/P01-runtime/phase.md) |

## Order and Reason
T01 establishes entry/basic clocks and invariant guides. T02 adds common moving geometry before T03 aiming depends on it. T04 decouples pattern completion from fixed order. T05 connects approved visuals/text to real states. T06 validates complete encounters and actual screenshots. One phase: no external infrastructure gate.

## Safeguards
- No DB/auth/deployment/music composition changes. Preserve guest/admin score and invincibility rules.
- Keep16x16 player damage,56x36 activation, Space.7s cooldown, .6s projectile immunity, minimum1.2s special spacing and viewport-resolution rendering.
- Phase changes do not mutate existing walls or prematurely apply boss factors. Advancing patterns never waits for player damage and boss clear never waits for queue exhaustion.
- Player weapon charge/fire/recharge remain.5/.2/10s; only valid rightward contact damages.
- Execute sequentially and commit each passing Task; final pointer-sync commit records all hashes.
- No unrelated scope issue found during planning.

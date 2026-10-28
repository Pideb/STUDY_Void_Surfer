# Plan: Boss Combat Evolution

## Goal
Implement approved D01..D15 in the actual game: capped speed, frequent encounters, six distinct boss attacks, safe repeated lasers, roar/WASD/counterattack, exact selected art/motion/audio and destination portal transitions. User authorized planning and automatic execution through the final Task.

## Decisions
[Confirmed decisions](../decisions/2026-10-27-boss-combat-evolution.md). Approved review sources stay in .memory/previews; production must not depend on review URLs.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | in_progress | Six sequential gameplay integration/verification Tasks | [P01](../phases/2026-10-28-boss-combat-evolution/P01-gameplay-integration/phase.md) |

## Task Boundaries
One Phase because the work changes one local game runtime and needs no external service milestone. Separate rules, scheduler, visuals, portal, audio and final validation so each commit is reviewable and regressions have a clear owner. Existing state machine/loader/audio graph must be extended, not duplicated.

## Progress
- done: 0/6. Active: T01.


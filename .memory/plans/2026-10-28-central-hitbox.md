# Plan: Central Hitbox, Clarity and Aircraft Balance

## Status
Completed2026-10-28:5/5 Tasks, final implementation/validation commit `b2ece8b`.48 files /621 tests passed, build/config/whitespace checks passed. [Evidence](../validation/2026-10-28-central-hitbox/report.md).

## Goal
Ship artwork stays large and crisp while damage uses16x16 and independent special activation56x36; line laser core excludes top/bottom10%; speedcaps70velocity/100others; AEGIS one-shot clears with3HP display.

## Decisions
[Confirmed decisions](../decisions/2026-10-28-central-hitbox.md). User authorized plan and execute through final Task unless a real blocker arises.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | done | Five sequential runtime/renderer/verification Tasks | [P01](../phases/2026-10-28-central-hitbox/P01-runtime/phase.md) |

## Rationale and regression traps
Geometry is shared first because duplicated bullet rectangles would otherwise retain old damage. Activation then uses independent box, balance consumes updated geometry/speed bounds, rendering finally changes pixels only. Final verification reconciles full flow and captures true fullscreen buffers. No adjacent out-of-scope defect identified.

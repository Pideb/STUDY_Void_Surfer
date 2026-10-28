# Plan: Dash and Boss Flow Refinements

## Goal
Implement confirmed D01..D09 in the actual runtime, including the amended rule that special walls never suppress projectile volleys. Complete sequential implementation, meaningful tests, actual renderer checks and per-Task commits.

## Decisions
[Confirmed decisions](../decisions/2026-10-28-dash-boss-flow-refinements.md). No art redesign, backend migration, deployment or unrelated account changes.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | in_progress | One runtime integration milestone, five independently validated Tasks | [P01](../phases/2026-10-28-dash-boss-flow-refinements/P01-runtime/phase.md) |

## Task Boundaries
T01 connects cooldown/input/render/protection as one usable behavior. T02 establishes wall-spacing invariants before scheduler changes. T03 changes the coupled laser/volley/roar state machine together. T04 adds independent admin visualization and portal geometry. T05 validates the integrated flow and closes all pointers. Shared engine changes are sequential, not concurrent.

## Progress
- done: 2/5. Active: T03.
